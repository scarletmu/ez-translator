export function createShadowContainer(id: string): { host: HTMLElement; shadow: ShadowRoot } {
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = id;
  host.style.cssText = 'all: initial; position: absolute; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  return { host, shadow };
}
