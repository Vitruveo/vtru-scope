export interface FormikDefaultProps {
  handleSubmit: (e?: React.FormEvent<HTMLFormElement> | undefined) => void;
  handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> | undefined;
}

export interface ShowModalProps {
  showModal: boolean;
  handleChangeModal: () => void;
}
