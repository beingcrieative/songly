"use client";

import React from "react";
import Avatar, { AvatarProps } from "./Avatar";

export interface ChatBubbleProps {
  role: "user" | "assistant";
  children: React.ReactNode;
  avatar?: AvatarProps | null;
  isTyping?: boolean;
  label?: string;
}

export default function ChatBubble({ role, children, avatar, isTyping = false, label }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
      aria-label={isUser ? "Gebruiker bericht" : "Assistent bericht"}
    >
      {!isUser && (
        <div className="mt-1 flex-shrink-0">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-lg px-3 py-2 shadow-sm md:px-4 md:py-3 ${
            isUser
              ? "text-white rounded-br-none"
              : "border border-[rgba(15,23,42,0.08)] bg-white/95 rounded-bl-none text-gray-800"
          }`}
          style={
            isUser
              ? { backgroundImage: "var(--gradient-primary)" }
              : undefined
          }
          aria-live={isTyping ? "polite" : undefined}
        >
          {label && (
            <p className="mb-1 text-[11px] font-medium text-gray-500">{label}</p>
          )}
          <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{children}</div>
        </div>
      </div>
      {isUser && (
        <div className="mt-1 flex-shrink-0">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
    </div>
  );
}
