# Cineminha

**Um player de YouTube para crianças pequenas que só toca os vídeos que você aprovou.**

[English](README.md)

O Cineminha é um app para o celular ou tablet. A criança vê miniaturas grandes dos vídeos que você escolheu, e mais nada: sem busca, sem recomendações, sem "a seguir".

- **Só a sua lista.** Quem adiciona vídeos são os pais, por uma página protegida por senha.
- **Sem vídeos relacionados.** Quando o vídeo pausa ou termina, o app cobre as sugestões do YouTube com uma tela própria.
- **Um vídeo de cada vez, até o fim.** Não tem barra para adiantar, e o botão voltar do celular não funciona até o vídeo acabar. Os adultos saem segurando o botão de voltar da tela.
- **Músicas e desenhos.** A tela inicial tem dois botões grandes. Cada categoria mostra 3 destaques e um botão para ver o resto.
- **Os dois pais adicionam vídeos** de qualquer celular ou computador, e o vídeo aparece na hora.
- **Pacotes prontos** para começar: músicas e desenhos de canais oficiais, em português, inglês e italiano.
- **Em português ou inglês**, o app inteiro.

Ele roda na sua própria conta gratuita da [Vercel](https://vercel.com). A lista é sua: ninguém mais vê, e não tem empresa no meio.

## Como montar (uns 15 minutos)

Você só precisa de um e-mail. Não precisa saber programar.

1. **Crie uma conta gratuita no GitHub** em [github.com/signup](https://github.com/signup). O GitHub guarda a sua cópia do código do app.
2. **Clique neste botão:**

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbruberries%2Fcineminha&project-name=cineminha&repository-name=cineminha&env=PARENT_PIN&envDescription=A+senha+dos+pais%3A+s%C3%B3+n%C3%BAmeros%2C+pelo+menos+6+d%C3%ADgitos.+Voc%C3%AA+vai+digitar+para+adicionar+v%C3%ADdeos.&envLink=https%3A%2F%2Fgithub.com%2Fbruberries%2Fcineminha%2Fblob%2Fmain%2FREADME.pt-BR.md%23senha-dos-pais&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22upstash%22%2C%22productSlug%22%3A%22upstash-kv%22%7D%5D)

   - Entre na Vercel com a sua conta do GitHub (se perguntar, escolha o plano gratuito **Hobby**).
   - Deixe o nome de repositório sugerido e clique em **Create**.
   - Quando a Vercel pedir um banco de dados, escolha **Upstash for Redis**, plano **Free**, e aceite. É onde fica a sua lista de vídeos.
   - <a id="senha-dos-pais"></a>Quando pedir **PARENT_PIN**, digite a senha dos pais: só números, pelo menos 6 dígitos. Anote; você vai precisar dela para adicionar vídeos.
   - Clique em **Deploy** e espere mais ou menos um minuto.
3. **Abra o seu app.** A Vercel mostra o endereço, algo como `cineminha-seunome.vercel.app`. Coloque `/pais` no final (por exemplo `cineminha-seunome.vercel.app/pais`), digite a senha e escolha:
   - o idioma,
   - o nome do app (aparece na tela e no ícone do celular),
   - com quais pacotes prontos começar, se quiser.
4. **Instale no aparelho da criança.**
   - **Android:** abra o endereço no Chrome e toque em **⋮ → Adicionar à tela inicial → Instalar**.
   - **iPhone/iPad:** abra no Safari e toque em **Compartilhar → Adicionar à Tela de Início**.
5. **Trave o aparelho no app** para a criança não conseguir sair.
   - **Android:** ligue *Configurações → Segurança → Fixar app* (o nome muda um pouco conforme a marca) e fixe o app pela tela de apps recentes.
   - **iPhone/iPad:** ligue *Ajustes → Acessibilidade → Acesso Guiado*, abra o app e clique três vezes no botão lateral.

A pergunta do banco de dados não apareceu no passo 2? Depois do deploy, abra o projeto na Vercel e vá em **Storage → Create Database → Upstash for Redis → Free**, ligue ao projeto e depois em **Deployments → ⋯ → Redeploy**.

## No dia a dia

**Adicionar um vídeo:** abra `seu-endereço/pais`, cole o link do YouTube, escolha a categoria e toque em **Adicionar**. Passe o endereço e a senha para o outro responsável, e ele também consegue adicionar.

**De dentro do app:** segure o nome do app no topo por 3 segundos e responda uma conta de multiplicar. Abre a área dos pais.

**Escolheu o vídeo errado?** Segure o botão de voltar, no canto superior esquerdo, por 1,5 segundo, até o anel amarelo fechar. Ele aparece nos primeiros 30 segundos de cada vídeo e depois fica invisível, mas continua funcionando no mesmo lugar. Um toque rápido não faz nada, então a criança não sai sem querer.

**Destaques:** os 3 primeiros vídeos de cada categoria são os que aparecem na tela inicial. Na área dos pais, use **Pôr em destaque**, ↑ e ↓ para escolher.

## Bom saber

- **Anúncios.** Se o vídeo tiver anúncio, o YouTube ainda pode mostrar um antes de começar.
- **Alguns vídeos não entram.** Quando o dono bloqueou tocar fora do YouTube, a área dos pais avisa.
- **Regras do YouTube.** O Cineminha usa o player embutido do próprio YouTube e cobre partes dele para esconder sugestões. Para uso da família tudo bem, mas os termos do YouTube não permitem cobrir o player em produtos para o público, então não transforme isto num serviço aberto.
- **Custo.** Os planos gratuitos da Vercel e do Upstash sobram para uma família.
- **Privacidade.** O app guarda só a sua lista de vídeos e os nomes digitados em "Seu nome". Não tem contas, estatísticas nem rastreamento.
- **Trocar a senha.** Na Vercel: seu projeto → **Settings → Environment Variables → PARENT_PIN → Edit**, e depois um redeploy.
- **10 senhas erradas** em uma hora bloqueiam a área dos pais naquela rede por uma hora.

## Pacotes prontos

| Pacote | Vídeos | Tipo | Idioma | Origem |
| --- | --- | --- | --- | --- |
| Tiquequê | 150 | Músicas | Português | Tiquequê |
| Pé de Sonho | 95 | Músicas | Português | Pé de Sonho |
| Palavra Cantada | 411 | Músicas | Português | Palavra Cantada Oficial |
| Vila Sésamo (músicas) | 5 | Músicas | Inglês | Sesame Street |
| Backyardigans (dublado) | 80 | Desenhos | Português | Treehouse Direct Brasil |
| Backyardigans (inglês) | 80 | Desenhos | Inglês | The Backyardigans - Official |
| George, o Curioso (inglês) | 774 | Desenhos | Inglês | Curious George Official |
| George, o Curioso (italiano) | 497 | Desenhos | Italiano | Curioso come George |

Cada pacote tem só músicas ou episódios avulsos (sem coletâneas de uma hora), e cada vídeo foi conferido para tocar fora do YouTube. Quer sugerir um pacote? Abra uma issue com o canal.

## Para quem programa

HTML, CSS e JavaScript puros, sem build. A API são duas funções da Vercel. Detalhes dos arquivos e do servidor local no [README em inglês](README.md#for-developers).

```sh
PARENT_PIN=1234 npm run dev   # http://localhost:3000, sem precisar de conta na Vercel
npm test                      # teste de ponta a ponta da API
```

## Licença

MIT. Feito por uma mãe que queria que a filha assistisse às músicas que ela escolheu, até o fim.
