"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { signIn } from "@/app/api/signIn";
import ApiStatusIcon from "@/app/signin/ApiStatusIcon";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUserInfo } from "@/store/useUserInfo";

const formSchema = z.object({
  id: z.string(),
  password: z.string(),
});

const Signin = () => {
  const router = useRouter();
  const [seePassword, setSeePassword] = useState(false);
  const setUserInfo = useUserInfo((state) => state.setUserInfo);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      id: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    toast.promise(signIn(data.id, data.password), {
      loading: "사용자 정보 확인 중...",
      success: (res) => {
        setUserInfo({ id: res.id });
        router.push("/chat");
        return "로그인을 완료하였습니다.";
      },
      error: (err) => err.message,
    });
  };

  return (
    <div className="w-full max-w-sm m-auto flex flex-col gap-4">
      <ApiStatusIcon live={false} />

      <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>ID</FieldLabel>
                <Input {...field} aria-invalid={fieldState.invalid} placeholder="ID" autoComplete="off" />
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
          <Field orientation="horizontal">
            <Button className="w-full hover:cursor-pointer hover:scale-105 active:scale-100 transition-all duration-200">Login</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};

export default Signin;
