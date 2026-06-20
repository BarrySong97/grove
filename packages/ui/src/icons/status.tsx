import { Check as LucideCheck, LoaderCircle, Plus as LucidePlus, type LucideProps } from 'lucide-react'

export const Check = (props: LucideProps) => <LucideCheck size={13} strokeWidth={2.6} {...props} />
export const Plus = (props: LucideProps) => <LucidePlus size={14} strokeWidth={2.4} {...props} />
export const Spinner = (props: LucideProps) => <LoaderCircle size={13} strokeWidth={2.2} {...props} />
