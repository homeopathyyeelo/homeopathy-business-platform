from kafka import KafkaProducer
import json
import logging
from django.conf import settings
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    producer = KafkaProducer(
        bootstrap_servers=settings.KAFKA_BROKERS,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        acks='all',
        retries=3
    )
except Exception as e:
    logger.error(f"Failed to create Kafka producer: {e}")
    producer = None


def publish_payment_event(event_type, data):
    """Publish payment event to Kafka"""
    if not producer:
        logger.warning("Kafka producer not available")
        return
    
    try:
        event = {
            'type': event_type,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        
        producer.send(settings.KAFKA_TOPIC_PAYMENTS, value=event)
        producer.flush()
        
        logger.info(f"Published event: {event_type}")
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
