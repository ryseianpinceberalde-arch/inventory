import { ReactNode, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "./Button";
import { errorMessage } from "../../services/api";

export function ActionForm({ children, submit, label, success }: { children: ReactNode; submit: () => Promise<unknown>; label: string; success: string }) {
  const [error, setError] = useState("");
  const mutation = useMutation({ mutationFn: submit, onSuccess: () => { setError(""); toast.success(success); }, onError: (error) => setError(errorMessage(error)) });
  return <form className="mt-6" onSubmit={(event) => { event.preventDefault(); if (!mutation.isPending) { setError(""); mutation.mutate(); } }}><fieldset disabled={mutation.isPending} className="space-y-4">
    {children}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="submit" busy={mutation.isPending}>{mutation.isPending ? "Saving…" : label}</Button>
  </fieldset></form>;
}
