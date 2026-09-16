"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const isBlobSrc = (src: unknown): src is string => typeof src === "string" && src.startsWith("blob:");

const IncomingImage = ({
  onReady,
  className,
  overlay,
  src,
  ...props
}: React.ComponentProps<typeof Image> & { onReady: () => void; overlay?: boolean }) => {
  const [ready, setReady] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setReady(true);
  }, [src]);

  useEffect(() => {
    if (ready) onReady();
  }, [ready]);

  return (
    <Image
      {...props}
      ref={imgRef}
      src={src}
      alt=""
      className={cn(className, overlay && "absolute inset-0", !ready && "opacity-0")}
      onLoad={() => setReady(true)}
    />
  );
};

const AttachmentImage = ({ alt = "", onLoad, className, src, ...props }: React.ComponentProps<typeof Image>) => {
  const [previewSrc, setPreviewSrc] = useState(() => (isBlobSrc(src) ? src : null));
  const [loaded, setLoaded] = useState(false);
  const previewSrcRef = useRef(previewSrc);

  const remoteSrc = isBlobSrc(src) ? undefined : src;

  useEffect(() => {
    previewSrcRef.current = previewSrc;
  }, [previewSrc]);

  useEffect(() => {
    return () => {
      if (isBlobSrc(previewSrcRef.current)) URL.revokeObjectURL(previewSrcRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {!loaded && (
        <Skeleton className="absolute inset-0 rounded-4xl flex items-center justify-center">
          <Spinner className="size-10" />
        </Skeleton>
      )}
      {previewSrc && (
        <Image
          {...props}
          src={previewSrc}
          alt={alt}
          className={className}
          unoptimized
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
        />
      )}
      {remoteSrc ? (
        <IncomingImage
          {...props}
          src={remoteSrc}
          alt=""
          overlay={!!previewSrc}
          className={className}
          onReady={() => {
            const prev = previewSrcRef.current;
            if (isBlobSrc(prev)) URL.revokeObjectURL(prev);
            setPreviewSrc(null);
            setLoaded(true);
          }}
        />
      ) : null}
    </div>
  );
};

export default AttachmentImage;
