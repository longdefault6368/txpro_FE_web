"use client";
import { useState, type ReactNode, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import s from "./Auth.module.css";
export default function AuthField({ label, icon, error, hint, id, ...input }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: ReactNode; error?: string; hint?: string }) {
 const [visible, setVisible] = useState(false);
 const password = input.type === "password";
 const description = error ? id + "-error" : hint ? id + "-hint" : undefined;
 return <div className={s.field}>
  <label htmlFor={id}>{label}</label>
  <div className={s.inputWrap}><span className={s.fieldIcon} aria-hidden="true">{icon}</span>
   <input {...input} id={id} type={password && visible ? "text" : input.type} className={[s.input, error && s.invalid, password && s.password].filter(Boolean).join(" ")} aria-invalid={Boolean(error)} aria-describedby={description} />
   {password && <button type="button" className={s.eye} aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible} onClick={() => setVisible(value => !value)} disabled={input.disabled}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button>}
  </div>
  {error ? <p id={id + "-error"} className={s.fieldError} role="alert">{error}</p> : hint && <p id={id + "-hint"} className={s.hint}>{hint}</p>}
 </div>;
}
