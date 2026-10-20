import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LabeledSlider from './LabeledSlider'

afterEach(cleanup)

describe('LabeledSlider', () => {
  it('shows the formatted value and bounds, and reports changes', () => {
    const onChange = vi.fn()
    render(
      <LabeledSlider
        label="Employment duration"
        value={25}
        min={3}
        max={360}
        required
        formatValue={(months) => `${months} months`}
        onChange={onChange}
      />,
    )

    const slider = screen.getByRole('slider', { name: 'Employment duration' })
    expect(screen.getByText('25 months')).toBeInTheDocument()
    expect(screen.getByText('3 months')).toBeInTheDocument()
    expect(screen.getByText('360 months')).toBeInTheDocument()

    fireEvent.change(slider, { target: { value: '30' } })
    expect(onChange).toHaveBeenCalledWith(30)
  })

  it('links the error message to the slider', () => {
    render(
      <LabeledSlider label="Credit score" value={300} min={300} max={850} errorMessage="Too low" onChange={vi.fn()} />,
    )

    const slider = screen.getByRole('slider', { name: 'Credit score' })
    expect(slider).toHaveAttribute('aria-describedby', screen.getByText('Too low').id)
  })
})
