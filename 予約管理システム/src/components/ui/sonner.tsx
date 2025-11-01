import { Toaster as Sonner } from "sonner@2.0.3"

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          color: 'rgb(17, 24, 39)',
          border: '1px solid rgb(229, 231, 235)',
        },
      }}
    />
  )
}
