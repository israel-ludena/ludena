"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { DialogTitle } from "@radix-ui/react-dialog";

import { useState } from "react";
export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) router.back();
      }}
    >
      <DialogTitle className='sr-only'>Dish Detail</DialogTitle>
      <DialogContent className='max-h-full overflow-auto'>{children}</DialogContent>
    </Dialog>
  );
}
