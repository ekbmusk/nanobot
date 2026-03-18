import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title = 'Растау',
  description = 'Бұл әрекетті орындауға сенімдісіз бе?',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel} width="max-w-md">
      <p className="mb-4 text-sm text-text-2">{description}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel} type="button">
          Болдырмау
        </button>
        <button className="rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white" onClick={onConfirm} type="button">
          Жою
        </button>
      </div>
    </Modal>
  )
}