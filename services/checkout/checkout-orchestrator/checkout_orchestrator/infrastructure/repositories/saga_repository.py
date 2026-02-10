from databases import Database
from checkout_orchestrator.api.schemas.saga import SagaState
import datetime
import json
from typing import Optional

class SagaRepository:
    def __init__(self, database: Database):
        self.database = database

    async def create_saga_table(self):
        query = """
        CREATE TABLE IF NOT EXISTS saga_states (
            id VARCHAR(255) PRIMARY KEY,
            state VARCHAR(255) NOT NULL,
            context TEXT NOT NULL,
            processed_event_ids TEXT DEFAULT '[]' NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        await self.database.execute(query)

    async def create(self, saga_state: SagaState) -> SagaState:
        query = """
        INSERT INTO saga_states (id, state, context, processed_event_ids, created_at, updated_at)
        VALUES (:id, :state, :context, :processed_event_ids, :created_at, :updated_at)
        """
        values = {
            "id": saga_state.id,
            "state": saga_state.state,
            "context": json.dumps(saga_state.context),
            "processed_event_ids": json.dumps(saga_state.processed_event_ids),
            "created_at": saga_state.created_at,
            "updated_at": saga_state.updated_at,
        }
        await self.database.execute(query, values)
        return saga_state

    async def get(self, saga_id: str) -> Optional[SagaState]:
        query = "SELECT id, state, context, processed_event_ids, created_at, updated_at FROM saga_states WHERE id = :id"
        row = await self.database.fetch_one(query, {"id": saga_id})
        if row:
            return SagaState(
                id=row["id"],
                state=row["state"],
                context=json.loads(row["context"]),
                processed_event_ids=json.loads(row["processed_event_ids"]),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
        return None

    async def update(self, saga_state: SagaState) -> SagaState:
        query = """
        UPDATE saga_states
        SET state = :state, context = :context, processed_event_ids = :processed_event_ids, updated_at = :updated_at
        WHERE id = :id
        """
        values = {
            "id": saga_state.id,
            "state": saga_state.state,
            "context": json.dumps(saga_state.context),
            "processed_event_ids": json.dumps(saga_state.processed_event_ids),
            "updated_at": datetime.datetime.now(datetime.timezone.utc),
        }
        await self.database.execute(query, values)
        return saga_state

    async def delete(self, saga_id: str):
        query = "DELETE FROM saga_states WHERE id = :id"
        await self.database.execute(query, {"id": saga_id})