import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Body from './Body'

afterEach(cleanup)

describe('Body', () => {
  it('provides a semantic main area for page content', () => {
    render(
      <Body className="page-layout">
        <h1>Example page</h1>
      </Body>,
    )

    expect(screen.getByRole('main')).toHaveClass('page-layout')
    expect(screen.getByRole('heading', { name: 'Example page' })).toBeInTheDocument()
  })

  it('renders an empty main area when no page content is supplied', () => {
    render(<Body />)

    expect(screen.getByRole('main')).toBeEmptyDOMElement()
  })
})
