import { describe, it, expect } from 'vitest';
import { transitText, guideProviderText } from './provider';

describe('textes de transparence', () => {
  it('nomment Anthropic et le repli DeepSeek quand le fournisseur est claude', () => {
    expect(transitText('claude')).toContain("l'API d'Anthropic (Claude), ou par DeepSeek");
    expect(guideProviderText('claude')).toContain("l'API d'Anthropic (modèle Claude)");
  });

  it('nomment DeepSeek seul quand le fournisseur est deepseek', () => {
    expect(transitText('deepseek')).toContain("l'API de DeepSeek");
    expect(transitText('deepseek')).not.toMatch(/Anthropic|Claude/);
    expect(guideProviderText('deepseek')).not.toMatch(/Anthropic|Claude/);
  });

  it('restent neutres tant que le fournisseur est inconnu', () => {
    expect(transitText(null)).not.toMatch(/Anthropic|Claude|DeepSeek/);
    expect(guideProviderText(null)).not.toMatch(/Anthropic|Claude|DeepSeek/);
  });
});
