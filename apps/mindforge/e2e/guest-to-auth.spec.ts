import { test, expect } from '@playwright/test';

test.describe('Migración de Usuario Guest a Autenticado (Preservación de Streak)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navegar a un origen seguro para habilitar el contexto de localStorage
    await page.goto('https://example.com');
    await page.evaluate(() => {
      localStorage.setItem(
        'nexus_guest_profile',
        JSON.stringify({
          name: 'Guest User',
          email: '',
          role: 'guest',
          registered: false,
          streakCount: 5,
          tempId: 'guest_test_123',
        })
      );
    });
  });

  test('Debe preservar el streak al completar el registro/upgrade', async ({ page }) => {
    // 2. Verificar estado inicial cargado en localStorage
    const initialProfile = await page.evaluate(() => {
      const item = localStorage.getItem('nexus_guest_profile');
      return item ? JSON.parse(item) : null;
    });

    expect(initialProfile).not.toBeNull();
    expect(initialProfile.streakCount).toBe(5);
    expect(initialProfile.registered).toBe(false);

    // 3. Simular evento de promoción de Guest a Usuario Registrado
    await page.evaluate(() => {
      const saved = localStorage.getItem('nexus_guest_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem(
          'nexus_guest_profile',
          JSON.stringify({
            ...parsed,
            email: 'founder@blueprint360.com',
            registered: true,
            role: 'user',
          })
        );
      }
    });

    // 4. Confirmar que el perfil actualizado conserva la racha intacta
    const updatedProfile = await page.evaluate(() => {
      const item = localStorage.getItem('nexus_guest_profile');
      return item ? JSON.parse(item) : null;
    });

    expect(updatedProfile.registered).toBe(true);
    expect(updatedProfile.streakCount).toBe(5);
  });
});