"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { checkId, signUp } from "@/app/api/signUp";

const formSchema = z
  .object({
    id: z.string().min(1, { error: "ID is required" }).min(4, { error: "ID is too short" }),
    password: z.string().min(1, { error: "Password is required" }).min(4, { error: "Password is too short" }),
    passwordConfirm: z.string().min(1, { error: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  });

const Signup = () => {
  const router = useRouter();
  const [seePassword, setSeePassword] = useState(false);
  const [seePasswordConfirm, setSeePasswordConfirm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: standardSchemaResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      id: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const handleIdBlur = async (id: string) => {
    const isValid = await form.trigger("id");
    if (!isValid) return;

    try {
      const { isDuplicate } = await checkId(id);
      if (isDuplicate) {
        form.setError("id", { type: "error", message: "이미 사용 중인 ID입니다." });
        return;
      }
      form.clearErrors("id");
    } catch {
      form.setError("id", { type: "error", message: "ID 중복 확인에 실패했습니다." });
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const { isDuplicate } = await checkId(data.id);

    if (isDuplicate) {
      form.setError("id", { type: "error", message: "이미 사용 중인 ID입니다." });
      return;
    }

    toast.promise(signUp(data.id, data.password), {
      loading: "로딩 중",
      success: () => {
        router.push("/signin");
        return "회원가입을 완료하였습니다.";
      },
      error: () => {
        return "회원가입에 실패하였습니다.";
      },
    });
  };

  return (
    <div className="w-full max-w-sm m-auto flex flex-col gap-4">
      <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>ID</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="ID"
                  autoComplete="off"
                  onBlur={() => {
                    field.onBlur();
                    void handleIdBlur(field.value);
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput {...field} placeholder="Password" type={seePassword ? "text" : "password"} />
                  <InputGroupAddon align="inline-end">
                    {seePassword ? (
                      <EyeIcon className="size-4 hover:cursor-pointer" onClick={() => setSeePassword(!seePassword)} />
                    ) : (
                      <EyeOffIcon className="size-4 hover:cursor-pointer" onClick={() => setSeePassword(!seePassword)} />
                    )}
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="passwordConfirm"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Password Confirm</FieldLabel>
                <InputGroup>
                  <InputGroupInput {...field} placeholder="Password Confirm" type={seePasswordConfirm ? "text" : "password"} />
                  <InputGroupAddon align="inline-end">
                    {seePasswordConfirm ? (
                      <EyeIcon className="size-4 hover:cursor-pointer" onClick={() => setSeePasswordConfirm(!seePasswordConfirm)} />
                    ) : (
                      <EyeOffIcon className="size-4 hover:cursor-pointer" onClick={() => setSeePasswordConfirm(!seePasswordConfirm)} />
                    )}
                  </InputGroupAddon>
                </InputGroup>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Field orientation="horizontal">
            <Button className="w-full hover:cursor-pointer hover:scale-105 active:scale-100 transition-all duration-200">Sign Up</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};

export default Signup;
