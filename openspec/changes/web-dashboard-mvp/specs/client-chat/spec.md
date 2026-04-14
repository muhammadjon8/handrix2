## ADDED Requirements

### Requirement: Client can send and receive messages in real time
The system SHALL render a chat bubble UI where client messages appear on the right and handyman messages appear on the left. New messages SHALL arrive via the `chat:message` WebSocket event on the `/chat` namespace per `docs/websocket-contract.md`. Sending a message SHALL call `POST /v1/chat/:jobId/messages`.

#### Scenario: Client sends a message
- **WHEN** the client types a message and taps Send
- **THEN** the message is optimistically appended to the chat (right side) and `POST /v1/chat/:jobId/messages` is called

#### Scenario: Handyman message received via WebSocket
- **WHEN** the `chat:message` event arrives for the active job
- **THEN** the message is appended to the chat on the left side with the handyman's name

#### Scenario: Message send fails
- **WHEN** `POST /v1/chat/:jobId/messages` returns an error
- **THEN** the optimistic message is marked with a "failed to send" indicator and a retry button

### Requirement: Chat history is loaded on screen open
The system SHALL call `GET /v1/chat/:jobId/messages` when the chat screen is opened and render the full message history in chronological order (oldest first, newest at bottom).

#### Scenario: History loaded on open
- **WHEN** the chat screen opens
- **THEN** the system fetches and renders all previous messages, scrolled to the bottom

### Requirement: Client can attach a photo to a message
The system SHALL provide an attachment button that opens the device file picker (image only). The selected image SHALL be previewed before sending. Photo upload mechanism is TBD (URL-based for MVP — client provides a URL string, not binary upload).

#### Scenario: Photo URL attached
- **WHEN** the client enters a photo URL and taps Send
- **THEN** the message content includes the URL and it is rendered as an image thumbnail in the chat

### Requirement: Client is notified of new messages when chat is not open
The system SHALL display a badge or toast notification when a `chat:message` event arrives and the chat screen is not the active view.

#### Scenario: Message received while on tracking screen
- **WHEN** a `chat:message` event arrives and the chat page is not visible
- **THEN** a toast notification appears with the sender name and a snippet of the message content

### Requirement: AI assist layer is reserved but not active in MVP
The system SHALL NOT render any AI message section or LLM-generated content in the MVP chat UI. Space is reserved in the component architecture for a future feature flag.

#### Scenario: No AI messages displayed
- **WHEN** the chat screen renders
- **THEN** no AI suggestion UI, AI avatar, or AI-labelled messages are visible to the user
