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
      className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
      aria-label={isUser ? "Gebruiker bericht" : "Assistent bericht"}
      data-message-role={role}
    >
      {!isUser && (
        <div className="mt-0.5 flex-shrink-0">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
      <div className={`flex max-w-[85%] md:max-w-[75%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 md:px-5 md:py-4 transition-all duration-200 md:hover:scale-[1.02] ${
            isUser
              ? "text-white rounded-br-md shadow-lg md:shadow-xl md:hover:shadow-2xl"
              : "border border-[rgba(15,23,42,0.12)] bg-white/98 backdrop-blur-sm rounded-bl-md text-gray-900 shadow-md md:shadow-lg md:hover:shadow-xl"
          }`}
          style={
            isUser
              ? {
                  backgroundImage: "var(--gradient-primary)",
                  boxShadow: "0 8px 24px -4px rgba(32, 178, 170, 0.4), 0 4px 8px -2px rgba(74, 222, 128, 0.3)",
                }
              : {
                  boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 8px -1px rgba(15, 23, 42, 0.04)",
                }
          }
          aria-live={isTyping ? "polite" : undefined}
        >
          {label && (
            <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${
              isUser ? "text-white/90" : "text-gray-500"
            }`}>
              {label}
            </p>
          )}
          <div className={`whitespace-pre-wrap leading-relaxed ${
            isUser ? "text-[15px] md:text-[16px]" : "text-[15px] md:text-[16px]"
          }`}>
            {children}
          </div>
        </div>
      </div>
      {isUser && (
        <div className="mt-0.5 flex-shrink-0">
          <Avatar size="sm" {...avatar} />
        </div>
      )}
    </div>
  );
}
