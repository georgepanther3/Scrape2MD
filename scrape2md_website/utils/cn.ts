export const cn = (...inputs: (string | undefined | null | false)[]) => {
  return inputs.filter(Boolean).join(" ");
};
