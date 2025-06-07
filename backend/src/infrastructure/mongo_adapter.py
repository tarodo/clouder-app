import logging
from typing import List, Dict, Tuple, Optional

from pymongo import InsertOne, UpdateOne
from pymongo.asynchronous.mongo_client import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from src.config import AppSettings

logger = logging.getLogger("mongo")


class AsyncMongoAdapter:
    def __init__(self, settings: AppSettings):
        self.settings = settings
        self.client: Optional[AsyncMongoClient] = None
        self.db: Optional[AsyncDatabase] = None

    async def connect(self) -> AsyncDatabase:
        """Connect to MongoDB and return the database object."""
        try:
            self.client = AsyncMongoClient(
                self.settings.MONGO_URL, 
                serverSelectionTimeoutMS=5000
            )
            # Optional: verify connection
            # await self.client.admin.command("ping")
            self.db = self.client[self.settings.MONGO_DB]
            return self.db
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB :: {e}")
            raise

    async def _get_db(self) -> AsyncDatabase:
        """Get database connection, reconnect if needed."""
        if self.client is None or self.db is None:
            await self.connect()
        return self.db

    async def close_connection(self):
        """Close MongoDB connection."""
        if self.client:
            await self.client.close()
            self.client = None
            self.db = None

    async def get_data(
        self,
        collection: str,
        query_filters: Optional[Dict] = None,
        query_fields: Optional[List[str]] = None,
        query_sort: Optional[List] = None,
    ) -> List[Dict]:
        """Get data from MongoDB"""
        logger.info(
            f"Get data : {collection} with filters : {query_filters} :: Start"
        )
        db = await self._get_db()
        processed_filters = query_filters if query_filters is not None else {}
        projection = {"_id": 0}
        
        if query_fields:
            projection.update({field: 1 for field in query_fields})

        cursor = db[collection].find(processed_filters, projection)
        
        if query_sort:
            cursor = cursor.sort(query_sort)
            
        # Asynchronously get all data
        return await cursor.to_list(length=None)

    async def save_data_mongo(
        self, 
        data: List[Dict], 
        collection_name: str, 
        key_fields: Optional[List[str]] = None
    ) -> Tuple[int, int]:
        """Save data to MongoDB collection"""
        logger.info(f"Save data : {collection_name} : count = {len(data)} :: Start")
        db = await self._get_db()

        operations = []
        for item in data:
            if key_fields:
                item_keys = {field: item[field] for field in key_fields}
                operations.append(UpdateOne(item_keys, {"$set": item}, upsert=True))
            else:
                operations.append(InsertOne(item))

        if not operations:
            logger.info(f"Save data : {collection_name} : count = 0 :: Done")
            return 0, 0
            
        result = await db[collection_name].bulk_write(operations)
        inserted = result.upserted_count
        updated = result.matched_count
        logger.info(f"Save data : {collection_name} : {inserted=} : {updated=} :: Done")
        return inserted, updated

    # Context manager for automatic connection management
    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close_connection()

