"use client";

import type { MouseEvent } from "react";
import { useCallback } from "react";
import { HeartIcon } from "@heroicons/react/16/solid";
import { Button } from "@heroui/react";

type HeartButtonProps = {
  isFavorite: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBackground?: boolean;
  hideWhenNotFavorite?: boolean;
};

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export default function HeartButton({
  isFavorite,
  onToggle,
  size = "md",
  className = "",
  showBackground = false,
  hideWhenNotFavorite = false,
}: HeartButtonProps) {
  const stopParentActivation = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const iconSize = sizeClasses[size];

  // Hide completely when not favorited and hideWhenNotFavorite is true
  if (hideWhenNotFavorite && !isFavorite) {
    return null;
  }

  return (
    <Button
      isIconOnly
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      // A heart carrying its own surface is a real object on the media, so the
      // unfavourited state is drawn by the icon's colour alone rather than by
      // fading the whole control to a pane of glass (ADR-0020). It keeps its
      // full size either way: a backgrounded heart sits in a row with the rest
      // of the photo's chrome, and a circle that is a little smaller than the
      // ones beside it reads as a mistake rather than as a state.
      className={`group relative transition-all duration-300 ${
        showBackground
          ? "bg-surface hover:bg-surface-secondary rounded-full shadow-md"
          : isFavorite
            ? "scale-100 opacity-100"
            : "scale-90 opacity-70 hover:scale-100 hover:opacity-100"
      } ${className} `}
      size={size === "lg" ? "md" : "sm"}
      type="button"
      variant="ghost"
      onClick={stopParentActivation}
      onPress={onToggle}
    >
      <HeartIcon
        className={` ${iconSize} transition-colors duration-300 ease-out ${isFavorite ? "text-red-500" : "text-muted group-hover:text-red-400"} `}
      />
    </Button>
  );
}
