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
    <div className={`flex items-end ${isUser ? "justify-end" : "justify-start"}`} aria-label={isUser ? "Gebruiker bericht" : "Assistent bericht"}>
      {!isUser && (
        <div className="mr-2 self-start">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3 py-2 md:px-4 md:py-3 shadow-sm ${
          isUser
            ? "text-white rounded-lg rounded-br-none"
            : "bg-white/95 text-gray-800 border border-[rgba(15,23,42,0.08)] rounded-lg rounded-bl-none"
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
      {isUser && (
        <div className="ml-2 self-start">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
    </div>
  );
}
