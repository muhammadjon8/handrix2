PART 3 — WEBSOCKET CONTRACT
Library: Socket.io
Auth: Pass JWT as handshake query: ?token=<JWT>

Namespace: /jobs
EventDirectionPayloadjob:matchedServer → Client{ jobId, handymanName, handymanAvatar, eta }job:availableServer → Handyman{ jobId, categoryName, distanceKm, payoutEstimate, eta }job:status_updateServer → Client{ jobId, status: JobStatus, updatedAt }job:completedServer → Client{ jobId, finalPrice, warrantyId }handyman:locationServer → Client{ jobId, lat, lng, eta }

Namespace: /chat
EventDirectionPayloadchat:messageServer → Client & Handyman{ jobId, senderId, senderName, senderRole, content, isAI, createdAt }chat:sendClient/Handyman → Server{ jobId, content }