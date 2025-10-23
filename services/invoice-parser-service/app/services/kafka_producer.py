"""
Kafka Producer - Publish events from outbox pattern
"""

import json
import asyncio
from typing import Dict
import asyncpg
from datetime import datetime

class KafkaProducer:
    """
    Publish events to Kafka from outbox table
    Implements reliable event publishing with outbox pattern
    """
    
    def __init__(self, db_conn, kafka_bootstrap_servers: str = "localhost:9092"):
        self.conn = db_conn
        self.bootstrap_servers = kafka_bootstrap_servers
        self.topic_prefix = "homeoerp"
    
    async def publish_event(self, event: Dict) -> str:
        """
        Create outbox event (will be published by worker)
        """
        event_id = event.get('id')
        
        query = """
            INSERT INTO outbox_events (
                id, aggregate_type, aggregate_id, event_type, payload, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        """
        
        row = await self.conn.fetchrow(
            query,
            event_id,
            event['aggregate_type'],
            event['aggregate_id'],
            event['event_type'],
            json.dumps(event['payload'])
        )
        
        return row['id']
    
    async def process_outbox(self, batch_size: int = 100):
        """
        Process unpublished events from outbox
        This should run as a background worker
        """
        # Get unpublished events
        query = """
            SELECT * FROM outbox_events
            WHERE published = false
            ORDER BY created_at ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
        """
        
        events = await self.conn.fetch(query, batch_size)
        
        published_count = 0
        
        for event in events:
            try:
                # Publish to Kafka (simulated here)
                await self._publish_to_kafka(event)
                
                # Mark as published
                update_query = """
                    UPDATE outbox_events
                    SET published = true,
                        published_at = NOW()
                    WHERE id = $1
                """
                await self.conn.execute(update_query, event['id'])
                
                published_count += 1
                
            except Exception as e:
                print(f"Failed to publish event {event['id']}: {e}")
                # Event remains unpublished for retry
        
        return {
            'processed': len(events),
            'published': published_count,
            'failed': len(events) - published_count
        }
    
    async def _publish_to_kafka(self, event: Dict):
        """
        Actual Kafka publishing (placeholder)
        In production, use aiokafka or confluent-kafka
        """
        topic = f"{self.topic_prefix}.{event['event_type']}"
        
        message = {
            'event_id': event['id'],
            'event_type': event['event_type'],
            'aggregate_type': event['aggregate_type'],
            'aggregate_id': event['aggregate_id'],
            'payload': json.loads(event['payload']) if isinstance(event['payload'], str) else event['payload'],
            'timestamp': event['created_at'].isoformat()
        }
        
        # TODO: Replace with actual Kafka producer
        # from aiokafka import AIOKafkaProducer
        # producer = AIOKafkaProducer(bootstrap_servers=self.bootstrap_servers)
        # await producer.start()
        # await producer.send(topic, json.dumps(message).encode())
        # await producer.stop()
        
        print(f"[KAFKA] Published to {topic}: {message['event_type']}")
        
        # Simulate async operation
        await asyncio.sleep(0.01)
    
    async def create_inventory_restocked_event(self, batch_update: Dict) -> str:
        """Create inventory.restocked event"""
        event = {
            'id': batch_update.get('event_id', str(asyncio.get_event_loop().time())),
            'aggregate_type': 'inventory',
            'aggregate_id': batch_update['batch_id'],
            'event_type': 'inventory.restocked.v1',
            'payload': {
                'shop_id': batch_update['shop_id'],
                'product_id': batch_update['product_id'],
                'batch_no': batch_update['batch_no'],
                'qty_added': batch_update['qty_added'],
                'new_total_qty': batch_update['new_qty'],
                'expiry_date': batch_update.get('expiry_date'),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return await self.publish_event(event)
    
    async def create_purchase_receipt_event(self, grn: Dict) -> str:
        """Create purchase.receipt.created event"""
        event = {
            'id': grn.get('event_id', str(asyncio.get_event_loop().time())),
            'aggregate_type': 'purchase_receipt',
            'aggregate_id': grn['id'],
            'event_type': 'purchase.receipt.created.v1',
            'payload': {
                'receipt_id': grn['id'],
                'receipt_number': grn['receipt_number'],
                'vendor_id': grn['vendor_id'],
                'shop_id': grn['shop_id'],
                'total_amount': float(grn['grand_total']),
                'status': grn['status'],
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return await self.publish_event(event)
    
    async def create_invoice_parsed_event(self, invoice: Dict) -> str:
        """Create invoice.parsed event"""
        event = {
            'id': invoice.get('event_id', str(asyncio.get_event_loop().time())),
            'aggregate_type': 'parsed_invoice',
            'aggregate_id': invoice['id'],
            'event_type': 'invoice.parsed.v1',
            'payload': {
                'invoice_id': invoice['id'],
                'vendor_id': invoice['vendor_id'],
                'shop_id': invoice['shop_id'],
                'total_amount': float(invoice['total_amount']),
                'line_count': invoice.get('line_count', 0),
                'confidence_score': float(invoice.get('confidence_score', 0)),
                'status': invoice['status'],
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return await self.publish_event(event)
    
    async def create_reconciliation_task_event(self, task: Dict) -> str:
        """Create reconciliation.task.created event"""
        event = {
            'id': task.get('event_id', str(asyncio.get_event_loop().time())),
            'aggregate_type': 'reconciliation_task',
            'aggregate_id': task['id'],
            'event_type': 'reconciliation.task.created.v1',
            'payload': {
                'task_id': task['id'],
                'invoice_id': task['parsed_invoice_id'],
                'task_type': task['task_type'],
                'description': task['description'],
                'status': task['status'],
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return await self.publish_event(event)
