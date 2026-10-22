import type { ComponentProps, CSSProperties } from "react";
import React from "react";
import { Modal } from "@heroui/react";
import { Button } from "react-aria-components";

/**
 * A Markdown image from the docs. Docusaurus gives local images their pixel
 * size; the screenshots are taken at 1.5x or 2x, so they show at half of it,
 * never taller than the shot cap, and open full size on a click. Two images
 * in one paragraph sit side by side (see `.shot` in custom.css). Remote
 * images (badges) carry no size and stay plain.
 */
export default function Screenshot({ width, height, ...props }: ComponentProps<"img">) {
  const w = Number(width);
  const h = Number(height);

  if (!w || !h) return <img height={height} width={width} {...props} />;

  return (
    <Modal>
      <Button
        aria-label={`Enlarge: ${props.alt ?? "screenshot"}`}
        className="shot"
        style={{ "--shot-ratio": w / h, "--shot-width": `${w / 2}px` } as CSSProperties}
      >
        <img height={h} width={w} {...props} />
      </Button>
      <Modal.Backdrop>
        <Modal.Container placement="center">
          <Modal.Dialog
            aria-label={props.alt ?? "Screenshot"}
            className="w-auto max-w-[min(94vw,80rem)] p-2"
          >
            {/* The shot has close buttons of its own, so the image itself closes the view. */}
            <Button aria-label="Close" className="cursor-zoom-out rounded-2xl" slot="close">
              <img
                alt={props.alt}
                className="max-h-[85vh] w-auto rounded-2xl object-contain"
                src={props.src}
              />
            </Button>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
