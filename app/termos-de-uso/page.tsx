import LegalPage from '@/components/legal/LegalPage';

export default function TermsPage() {
  return <LegalPage title="Termos de Uso" updatedAt="3 de agosto de 2026" sections={[
    { title: '1. Aceitacao', paragraphs: ['Ao criar uma conta ou utilizar a Gringoou, voce declara que leu e concorda com estes termos e com a Politica de Privacidade.'] },
    { title: '2. Uso da plataforma', paragraphs: ['Voce deve fornecer informacoes verdadeiras, proteger suas credenciais e utilizar os recursos de forma licita e respeitosa.', 'Conteudos, vagas e anuncios de moradia sao de responsabilidade de seus autores e podem ser moderados quando violarem estas regras.'] },
    { title: '3. Publicacoes e negocios', paragraphs: ['A Gringoou pode revisar, limitar ou remover conteudos enganosos, ilegais ou prejudiciais. Empresas e recrutadores devem possuir autorizacao para divulgar oportunidades.'] },
    { title: '4. Responsabilidades', paragraphs: ['A plataforma aproxima membros da comunidade, mas nao e parte de contratos celebrados entre usuarios, anunciantes, empregadores ou proprietarios.'] },
    { title: '5. Contato e alteracoes', paragraphs: ['Estes termos podem ser atualizados para refletir mudancas legais ou de produto. O uso continuado apos a atualizacao representa aceitacao da nova versao.'] },
  ]} />;
}
