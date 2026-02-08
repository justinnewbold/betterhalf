import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws on render
function ThrowingComponent() {
  throw new Error('Test error');
}

function GoodComponent() {
  return <Text>Hello</Text>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders fallback UI on error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<Text>Custom fallback</Text>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(getByText('Custom fallback')).toBeTruthy();
  });
});
