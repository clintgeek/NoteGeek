import React from 'react';
import { AppShell, Burger, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Sidebar from './Sidebar'; // We'll create this next

function Layout({ children }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div>NoteGeek</div> {/* Basic Header Content */}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Sidebar closeNavbar={toggle} />
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export default Layout;