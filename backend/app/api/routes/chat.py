from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user
from app.core.database import get_db_session
from app.models.chat import ChatMessage, Conversation
from app.models.enums import UserRole
from app.models.listing import CarListing
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreateRequest,
    ChatMessageResponse,
    ConversationResponse,
)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def get_or_create_conversation(
    listing_id: UUID = Query(...),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    listing = session.get(CarListing, listing_id)
    if listing is None or listing.is_archived:
        raise HTTPException(status_code=404, detail="Listing not found")

    conversation = session.scalar(
        select(Conversation)
        .options(
            joinedload(Conversation.listing).joinedload(CarListing.images),
            joinedload(Conversation.customer).joinedload(User.profile),
            joinedload(Conversation.messages),
        )
        .where(
            Conversation.listing_id == listing_id,
            Conversation.customer_id == current_user.id,
        )
    )

    if conversation is None:
        conversation = Conversation(listing_id=listing_id, customer_id=current_user.id)
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

    messages = sorted(conversation.messages, key=lambda m: m.created_at) if conversation.messages else []
    last_message = messages[-1] if messages else None
    unread_count = sum(1 for m in messages if not m.is_read and m.sender_id != current_user.id)

    customer_info = None
    if current_user.role == UserRole.ADMIN and conversation.customer:
        cust_name = conversation.customer.profile.display_name if conversation.customer.profile and conversation.customer.profile.display_name else conversation.customer.email.split("@")[0]
        cust_phone = conversation.customer.profile.phone_number if conversation.customer.profile else None
        customer_info = {
            "id": conversation.customer.id,
            "display_name": cust_name,
            "email": conversation.customer.email,
            "phone_number": cust_phone,
        }

    return {
        "id": conversation.id,
        "listing_id": conversation.listing_id,
        "customer_id": conversation.customer_id,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "listing": conversation.listing,
        "customer": customer_info,
        "last_message": last_message,
        "unread_count": unread_count,
    }



@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, object]]:
    query = select(Conversation).options(
        joinedload(Conversation.listing).joinedload(CarListing.images),
        joinedload(Conversation.customer).joinedload(User.profile),
        joinedload(Conversation.messages),
    )

    if current_user.role != UserRole.ADMIN:
        query = query.where(Conversation.customer_id == current_user.id)

    conversations = session.scalars(query.order_by(Conversation.updated_at.desc())).unique().all()

    result = []
    for conv in conversations:
        messages = sorted(conv.messages, key=lambda m: m.created_at)
        last_message = messages[-1] if messages else None
        unread_count = sum(1 for m in messages if not m.is_read and m.sender_id != current_user.id)

        customer_info = None
        if current_user.role == UserRole.ADMIN and conv.customer:
            cust_name = conv.customer.profile.display_name if conv.customer.profile and conv.customer.profile.display_name else conv.customer.email.split("@")[0]
            cust_phone = conv.customer.profile.phone_number if conv.customer.profile else None
            customer_info = {
                "id": conv.customer.id,
                "display_name": cust_name,
                "email": conv.customer.email,
                "phone_number": cust_phone,
            }

        result.append({
            "id": conv.id,
            "listing_id": conv.listing_id,
            "customer_id": conv.customer_id,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "listing": conv.listing,
            "customer": customer_info,
            "last_message": last_message,
            "unread_count": unread_count,
        })

    return result



@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatMessageResponse])
def get_conversation_messages(
    conversation_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[ChatMessageResponse]:
    conversation = session.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.role != UserRole.ADMIN and conversation.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Mark unread messages from other user as read
    updated = False
    for msg in conversation.messages:
        if not msg.is_read and msg.sender_id != current_user.id:
            msg.is_read = True
            updated = True
    if updated:
        session.commit()

    sorted_msgs = sorted(conversation.messages, key=lambda m: m.created_at)
    return [
        ChatMessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            body=m.body,
            is_read=m.is_read,
            status="read" if m.is_read else "delivered",
            created_at=m.created_at,
        )
        for m in sorted_msgs
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def post_chat_message(
    conversation_id: UUID,
    payload: ChatMessageCreateRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> ChatMessageResponse:
    conversation = session.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.role != UserRole.ADMIN and conversation.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    message = ChatMessage(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        body=payload.body.strip(),
        is_read=False,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return ChatMessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        body=message.body,
        is_read=message.is_read,
        status="delivered",
        created_at=message.created_at,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    conversation = session.get(Conversation, conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.role != UserRole.ADMIN and conversation.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    for msg in conversation.messages:
        session.delete(msg)
    session.delete(conversation)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


