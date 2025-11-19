# Punch

Webhook delivery system

## Description

Punch is a proof-of-concept webhook delivery system designed to enable various
devices and services I run in my home and elsewhere to send webhooks to a
centralized topic that I can then subscribe to and process as needed.

> [!IMPORTANT]
> This is a personal project that utilizes a private secret management service.
> If you wish to use this code, you will need to adapt it to your own secret
> management solution (docker secrets would be easy to implement).

## How To Use

### Publisher

1. Post a payload to a topic to the endpoint below. The bearer token is a
predetermined secret that you will need to configure in your own instance.

```jsonc
// POST /webhook

// Headers:
// Authorization: Bearer <token>

// Body:
{
    "topic": "your-topic-name",
    "data": {
        "key": "value",
        "foo": "bar",
        "number": 123
    }
}
```

2. The server will queue the message to be delivered to subscribers of that topic.

### Subscriber

1. Request a nonce to connect to the websocket.

```jsonc
// POST /nonce

// Headers:
// Authorization: Bearer <token>

// Body:
{}
```

> [!WARNING]
> I did not implement loading a certificate bundle for `wss://` connections.
> This is something that I still need to implement. In the meantime, I would
> not recommend using this in production for anything sensitive.

2. Connect to the websocket: `ws://<server>/ws`
3. Send the nonce received in step 1 to authenticate the websocket connection.

```jsonc
// WebSocket Message:
{
    "type": "CONNECT",
    "data": {
        "nonce": "<nonce>"
    }
}
```

4. Subscribe to a topic by sending a SUBSCRIBE message. You can subscribe to
multiple topics by sending multiple SUBSCRIBE messages.

```jsonc
// WebSocket Message:
{
    "type": "SUBSCRIBE",
    "data": {
        "topic": "your-topic-name"
    }
}
```

5. You can explicitly unsubscribe from a topic by sending an UNSUBSCRIBE message.
This is optional, as the server will automatically unsubscribe you from all topics
when the websocket connection is closed.

```jsonc
// WebSocket Message:
{
    "type": "UNSUBSCRIBE",
    "data": {
        "topic": "your-topic-name"
    }
}
```
