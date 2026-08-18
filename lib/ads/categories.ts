export const AD_BUSINESS_CATEGORIES = [
  { value: 'Alimentacao & Bebidas', label: 'Alimentacao & Bebidas', examples: ['Restaurante Brasileiro', 'Cafe', 'Padaria', 'Food Truck', 'Marmiteiro'] },
  { value: 'Servicos Domesticos & Encanamento', label: 'Servicos Domesticos & Encanamento', examples: ['Encanador', 'Eletricista', 'Limpeza', 'Handyman', 'HVAC'] },
  { value: 'Construcao & Reformas', label: 'Construcao & Reformas', examples: ['Empreiteiro Geral', 'Telhados', 'Pintura', 'Paisagismo'] },
  { value: 'Imoveis & Moradia', label: 'Imoveis & Moradia', examples: ['Corretor de Imoveis', 'Administracao de Imoveis', 'Alugueis'] },
  { value: 'Saude & Bem-Estar', label: 'Saude & Bem-Estar', examples: ['Dentista', 'Clinica', 'Personal Trainer', 'Spa', 'Salao de Beleza'] },
  { value: 'Servicos Profissionais', label: 'Servicos Profissionais', examples: ['Contabilidade', 'Advocacia', 'Servicos Financeiros', 'Seguros'] },
  { value: 'Automotivo', label: 'Automotivo', examples: ['Oficina Mecanica', 'Lava-jato', 'Guincho'] },
  { value: 'Varejo & Lojas Locais', label: 'Varejo & Lojas Locais', examples: ['Boutique', 'Mercado', 'Pet Shop'] },
  { value: 'Educacao & Aulas', label: 'Educacao & Aulas', examples: ['Escola de Idiomas', 'Aulas Particulares', 'Aulas de Musica'] },
  { value: 'Outros Servicos Locais', label: 'Outros Servicos Locais', examples: ['Outro servico local'] },
] as const;

export const AD_BUSINESS_CATEGORY_VALUES = AD_BUSINESS_CATEGORIES.map((item) => item.value);
