interface Props {
  onClose?: () => void
  onMin?: () => void
  onMax?: () => void
}

export function WindowControls({ onClose, onMin, onMax }: Props) {
  return (
    <div className="win-controls">
      <button type="button" className="win-ctl win-ctl-close" title="Tutup" onClick={onClose} />
      <button type="button" className="win-ctl win-ctl-min" title="Minimalkan" onClick={onMin} />
      <button type="button" className="win-ctl win-ctl-max" title="Maksimalkan" onClick={onMax} />
    </div>
  )
}
