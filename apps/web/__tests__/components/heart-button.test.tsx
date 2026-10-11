import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import "@testing-library/jest-dom";

import HeartButton from "@/components/shared/heart-button";

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    className,
    "aria-pressed": ariaPressed,
  }: {
    children: React.ReactNode;
    className?: string;
    "aria-pressed"?: boolean;
  }) => (
    <button aria-pressed={ariaPressed} className={className} type="button">
      {children}
    </button>
  ),
}));

function heart(): HTMLElement {
  return screen.getByRole("button");
}

/**
 * The heart carries its state in the icon and, without a surface of its own,
 * in how present the control is. With one — floating on a recipe photo, in a
 * row beside the back and actions circles — the presence cue has to go: a
 * circle that is a little smaller than the ones beside it reads as a mistake
 * rather than as a state.
 */
describe("HeartButton", () => {
  it("keeps a backgrounded heart at full size when it is not a favourite", () => {
    render(<HeartButton showBackground isFavorite={false} onToggle={vi.fn()} />);

    expect(heart().className).not.toMatch(/\bscale-90\b/);
    expect(heart().className).not.toMatch(/\bopacity-70\b/);
  });

  it("keeps a backgrounded heart at full size when it is a favourite", () => {
    render(<HeartButton showBackground isFavorite onToggle={vi.fn()} />);

    expect(heart().className).not.toMatch(/\bscale-90\b/);
  });

  it("lets the caller's chrome class through untouched", () => {
    render(
      <HeartButton
        showBackground
        className="size-10 min-w-10"
        isFavorite={false}
        onToggle={vi.fn()}
      />
    );

    expect(heart().className).toContain("size-10");
    expect(heart().className).toContain("min-w-10");
  });

  it("still fades a heart with no surface of its own", () => {
    render(<HeartButton isFavorite={false} onToggle={vi.fn()} />);

    expect(heart().className).toMatch(/\bscale-90\b/);
    expect(heart().className).toMatch(/\bopacity-70\b/);
  });

  it("renders nothing when it is asked to hide off-state", () => {
    render(<HeartButton hideWhenNotFavorite isFavorite={false} onToggle={vi.fn()} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
