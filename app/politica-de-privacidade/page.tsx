import LegalPage from '@/components/legal/LegalPage';

export default function PrivacyPage() {
  return <LegalPage title="Politica de Privacidade" updatedAt="3 de agosto de 2026" sections={[
    { title: '1. Dados coletados', paragraphs: ['Coletamos dados de conta, perfil, localizacao informada, interacoes e conteudos necessarios para operar e personalizar a comunidade.'] },
    { title: '2. Como usamos os dados', paragraphs: ['Usamos os dados para autenticar usuarios, entregar conteudo regional, prevenir abusos, oferecer suporte e melhorar a experiencia da plataforma.'] },
    { title: '3. Compartilhamento', paragraphs: ['Nao vendemos dados pessoais. Podemos compartilhar dados com provedores essenciais de infraestrutura, sempre limitados a finalidade do servico e sujeitos a medidas de seguranca.'] },
    { title: '4. Retencao e seguranca', paragraphs: ['Mantemos dados pelo periodo necessario para prestar o servico e cumprir obrigacoes legais. Aplicamos controles tecnicos e organizacionais para reduzir riscos de acesso indevido.'] },
    { title: '5. Seus direitos', paragraphs: ['Voce pode solicitar acesso, correcao ou exclusao de dados, conforme a legislacao aplicavel, pelos canais oficiais de atendimento da Gringoou.'] },
  ]} />;
}
