/**
 * Defensive patch for the StacksProvider global property.
 *
 * Multiple Stacks wallet browser extensions (Leather, Xverse) compete to
 * define `window.StacksProvider` using `Object.defineProperty` with
 * `configurable: false`.  When @stacks/connect later tries to (re)assign
 * the property it throws:
 *
 *   TypeError: Cannot redefine property: StacksProvider
 *
 * In development builds the error is swallowed by React's error overlay,
 * but in production it is a fatal unhandled exception that crashes the
 * entire Next.js client.
 *
 * **This module must be imported before @stacks/connect.**
 *
 * It replaces the non-configurable descriptor with a configurable one
 * so that subsequent Object.defineProperty calls succeed instead of
 * throwing.
 */

export function patchStacksProvider(): void {
    if (typeof window === 'undefined') return;

    try {
        const desc = Object.getOwnPropertyDescriptor(window, 'StacksProvider');
        if (desc && !desc.configurable) {
            // Re-create the property as configurable + writable so that
            // @stacks/connect and wallet extensions can coexist.
            const currentValue = (window as any).StacksProvider;
            delete (window as any).StacksProvider; // will silently fail
            Object.defineProperty(window, 'StacksProvider', {
                value: currentValue,
                writable: true,
                configurable: true,
                enumerable: true,
            });
        }
    } catch {
        // If patching fails (e.g. in a strict sandbox), fall through —
        // the error boundary on the page will catch the downstream error.
    }
}
