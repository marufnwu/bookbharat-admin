import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';

jest.mock('./auth/useAuth', () => ({
  useAuth: () => ({ user: { name: 'Admin' }, logout: jest.fn() }),
}));
jest.mock('./components/NotificationBell', () => ({ NotificationBell: () => null }));

let desktop = false;
let listeners: Set<(event: MediaQueryListEvent) => void>;

beforeEach(() => {
  desktop = false;
  listeners = new Set();
  window.matchMedia = jest.fn().mockImplementation((media: string) => ({
    media,
    get matches() { return desktop; },
    onchange: null,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
});

function CurrentRoute() {
  return <div data-testid="current-route">{useLocation().pathname}</div>;
}

function renderLayout(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="*" element={<CurrentRoute />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function expandAll(container: HTMLElement) {
  let buttons = within(container).queryAllByRole('button', { expanded: false });
  while (buttons.length) {
    fireEvent.click(buttons[0]);
    buttons = within(container).queryAllByRole('button', { expanded: false });
  }
}

function links(container: HTMLElement) {
  return within(container).getAllByRole('link').map(link => ({
    name: link.textContent,
    href: link.getAttribute('href'),
  }));
}

test('mobile exposes the complete desktop navigation including nested links', async () => {
  renderLayout();
  const sidebar = screen.getByRole('complementary');
  expandAll(sidebar);
  const desktopLinks = links(sidebar);
  expect(desktopLinks.length).toBeGreaterThan(60);

  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const dialog = await screen.findByRole('dialog', { name: 'Menu' });
  expandAll(dialog);
  expect(links(dialog)).toEqual(desktopLinks);
  expect(within(dialog).getByRole('link', { name: 'Commission Rules' })).toHaveAttribute('href', '/affiliates/commission-rules');
  expect(within(dialog).getByRole('link', { name: 'Roles & Permissions' })).toBeInTheDocument();
});

test('selecting a nested mobile link navigates and closes the drawer', async () => {
  renderLayout();
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const dialog = await screen.findByRole('dialog', { name: 'Menu' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'System' }));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Migration' }));
  fireEvent.click(within(dialog).getByRole('link', { name: 'Settings' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByTestId('current-route')).toHaveTextContent('/migration/settings');
});

test('opening the menu reveals the active nested route and selecting it closes the drawer', async () => {
  renderLayout('/migration/settings');
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const dialog = await screen.findByRole('dialog', { name: 'Menu' });
  const current = within(dialog).getByRole('link', { name: 'Settings' });
  expect(current).toHaveAttribute('aria-current', 'page');
  fireEvent.click(current);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('resizing to desktop closes the modal navigation', async () => {
  renderLayout();
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  await screen.findByRole('dialog', { name: 'Menu' });
  act(() => {
    desktop = true;
    listeners.forEach(listener => listener({ matches: true } as MediaQueryListEvent));
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});

test('Escape closes the drawer and returns focus to the menu trigger', async () => {
  renderLayout();
  const trigger = screen.getByRole('button', { name: 'Open navigation' });
  trigger.focus();
  fireEvent.click(trigger);
  const dialog = await screen.findByRole('dialog', { name: 'Menu' });
  fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
});
