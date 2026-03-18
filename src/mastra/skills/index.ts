import { UI_UX_DESIGN_SKILL } from './ui-ux-design';

export { UI_UX_DESIGN_SKILL };

const ROLE_SKILLS: Record<string, string> = {
  'Product Designer': UI_UX_DESIGN_SKILL,
};

export function getSkillsForRole(role: string): string {
  return ROLE_SKILLS[role] ?? '';
}
