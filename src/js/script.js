// IIFE: executa tudo em um escopo fechado, sem criar variáveis globais
(function () {
    'use strict'; // Modo estrito: evita erros silenciosos

    // ---------- Configurações (altere aqui) ----------
    // Número no formato internacional: 55 + DDD + número, só dígitos
    const numeroWhatsApp = '5582981744522';
    const nomeEmpresa = 'FixHome';

    // ---------- Referências aos elementos da página ----------
    const formularioOrcamento = document.getElementById('formulario-orcamento');
    const campoNome = document.getElementById('campo-nome');
    const campoBairro = document.getElementById('campo-bairro');
    const campoEndereco = document.getElementById('campo-endereco');
    const campoComplemento = document.getElementById('campo-complemento');
    const campoUrgencia = document.getElementById('campo-urgencia');
    const campoDetalhes = document.getElementById('campo-detalhes');
    const mensagemErro = document.getElementById('mensagem-erro');
    const resumoSelecao = document.getElementById('resumo-selecao');
    const botaoEnviar = document.getElementById('botao-enviar');
    const listaOrdem = document.getElementById('lista-ordem');
    const detalhesOrdem = document.getElementById('detalhes-ordem');

    // Se o formulário não existir, não há o que fazer
    if (!formularioOrcamento) return;

    // Retorna a lista (texto) dos serviços que estão marcados
    function obterServicosSelecionados() {
        const marcados = formularioOrcamento.querySelectorAll('input[name="servico"]:checked');
        return Array.from(marcados).map(function (caixa) {
            return caixa.value;
        });
    }

    // Remove espaços extras e limita o tamanho do texto digitado
    function limparTexto(texto) {
        return texto.trim().replace(/\s+/g, ' ').slice(0, 500);
    }

    // Função responsável por formatar o texto do pedido que será enviado ao WhatsApp.
    // Usa *asteriscos* (negrito do WhatsApp) e emojis para deixar a leitura organizada.
    // Os emojis estão em código Unicode (\u{...}) para não dependerem da codificação do arquivo.
    function gerarMensagemWhatsApp() {
        const emoji = {
            ferramenta: '\u{1F527}',
            aceno: '\u{1F44B}',
            prancheta: '\u{1F4CB}',
            check: '\u2705',
            pino: '\u{1F4CD}',
            casa: '\u{1F3E0}',
            porta: '\u{1F6AA}',
            bairro: '\u{1F3D8}\uFE0F',
            relogio: '\u23F0',
            bloco: '\u{1F4DD}',
            maos: '\u{1F64F}'
        };
        const servicos = obterServicosSelecionados();
        const nome = limparTexto(campoNome.value);
        const bairro = limparTexto(campoBairro.value);
        const endereco = limparTexto(campoEndereco.value);
        const complemento = limparTexto(campoComplemento.value);
        const detalhes = limparTexto(campoDetalhes.value);
        const separador = '\u2501'.repeat(15);

        // Cada bloco é uma parte da mensagem; no final eles são unidos com uma linha em branco
        const blocos = [];

        blocos.push(emoji.ferramenta + ' *PEDIDO DE ORÇAMENTO*\n' + separador);
        blocos.push('Olá, ' + nomeEmpresa + '! ' + emoji.aceno + (nome ? '\nMeu nome é *' + nome + '*.' : ''));

        // Títulos dos serviços, iguais aos que aparecem nos cartões da página
        blocos.push(emoji.prancheta + ' *Serviços solicitados*\n' + servicos.map(function (servico) {
            return emoji.check + ' ' + servico;
        }).join('\n'));

        // Bloco do local: só inclui as linhas que o cliente preencheu
        const local = [];
        if (endereco) local.push(emoji.casa + ' Endereço: ' + endereco);
        if (complemento) local.push(emoji.porta + ' Complemento: ' + complemento);
        if (bairro) local.push(emoji.bairro + ' Bairro: ' + bairro);
        if (local.length) blocos.push(emoji.pino + ' *Local do atendimento*\n' + local.join('\n'));

        blocos.push(emoji.relogio + ' *Prazo desejado*\n' + campoUrgencia.value);
        if (detalhes) blocos.push(emoji.bloco + ' *Detalhes do problema*\n' + detalhes);

        blocos.push(separador + '\nAguardo o retorno com o orçamento. Obrigado! ' + emoji.maos);

        return blocos.join('\n\n');
    }

    // Cria a URL oficial do WhatsApp com a mensagem já codificada
    function criarLinkWhatsApp(mensagem) {
        return 'https://wa.me/' + numeroWhatsApp + '?text=' + encodeURIComponent(mensagem);
    }

    // Atualiza o texto abaixo do botão conforme o usuário marca os serviços
    function atualizarResumoSelecao() {
        const total = obterServicosSelecionados().length;
        if (total === 0) {
            resumoSelecao.textContent = 'Nenhum serviço selecionado.';
        } else if (total === 1) {
            resumoSelecao.textContent = '1 serviço selecionado.';
        } else {
            resumoSelecao.textContent = total + ' serviços selecionados.';
        }
        // O botão avisa o que fazer e muda quando há serviço marcado
        if (total === 0) {
            botaoEnviar.textContent = 'Escolha um serviço para continuar';
            botaoEnviar.setAttribute('aria-disabled', 'true');
        } else {
            botaoEnviar.textContent = 'Enviar pedido no WhatsApp (' + total + (total === 1 ? ' serviço)' : ' serviços)');
            botaoEnviar.setAttribute('aria-disabled', 'false');
        }
        // O aviso de "nenhum serviço" some assim que algum serviço é marcado
        if (total > 0) mensagemErro.hidden = true;
    }

    // Mostra um aviso claro explicando o que o usuário precisa fazer
    function mostrarErro(texto) {
        mensagemErro.textContent = texto;
        mensagemErro.hidden = false;
    }

    // Campos obrigatórios (na ordem em que aparecem na tela) e a mensagem de cada um.
    // Complemento e "Detalhes do problema" ficam de fora porque são opcionais.
    const camposObrigatorios = [
        { campo: campoNome, mensagem: 'Informe seu nome para sabermos com quem falar.' },
        { campo: campoUrgencia, mensagem: 'Escolha para quando você precisa do serviço.' },
        { campo: campoEndereco, mensagem: 'Informe o endereço (rua e número) para encontrarmos sua casa.' },
        { campo: campoBairro, mensagem: 'Informe o bairro onde será o atendimento.' }
    ];

    // Retorna o <p> de erro do campo; cria o elemento na primeira vez
    function obterCaixaErro(campo) {
        let caixa = document.getElementById('erro-' + campo.id);
        if (!caixa) {
            caixa = document.createElement('p');
            caixa.id = 'erro-' + campo.id;
            caixa.className = 'erro-campo';
            caixa.hidden = true;
            campo.parentElement.appendChild(caixa);
            campo.setAttribute('aria-describedby', caixa.id); // leitores de tela leem a mensagem
        }
        return caixa;
    }

    // Marca o campo como inválido e mostra a mensagem logo abaixo dele
    function mostrarErroCampo(campo, texto) {
        const caixa = obterCaixaErro(campo);
        caixa.textContent = texto;
        caixa.hidden = false;
        campo.setAttribute('aria-invalid', 'true');
        campo.parentElement.classList.add('campo-invalido');
    }

    // Remove o destaque e a mensagem de erro do campo
    function limparErroCampo(campo) {
        const caixa = document.getElementById('erro-' + campo.id);
        if (caixa) caixa.hidden = true;
        campo.removeAttribute('aria-invalid');
        campo.parentElement.classList.remove('campo-invalido');
    }

    // Confere serviços e campos obrigatórios. Mostra todos os erros de uma vez
    // e leva o cliente até o primeiro problema. Retorna true se estiver tudo certo.
    function validarFormulario() {
        let primeiroErro = null;

        if (obterServicosSelecionados().length === 0) {
            mostrarErro('Marque pelo menos um serviço para montarmos seu orçamento.');
            primeiroErro = mensagemErro;
        }

        camposObrigatorios.forEach(function (item) {
            if (limparTexto(item.campo.value) === '') { // vazio ou só espaços
                mostrarErroCampo(item.campo, item.mensagem);
                if (!primeiroErro) primeiroErro = item.campo;
            } else {
                limparErroCampo(item.campo);
            }
        });

        if (!primeiroErro) return true;
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (primeiroErro !== mensagemErro) primeiroErro.focus({ preventScroll: true });
        return false;
    }

    // Tira o erro de um campo assim que o cliente corrige o valor
    function configurarLimpezaDeErros() {
        camposObrigatorios.forEach(function (item) {
            ['input', 'change'].forEach(function (evento) {
                item.campo.addEventListener(evento, function () {
                    if (limparTexto(item.campo.value) !== '') limparErroCampo(item.campo);
                });
            });
        });
    }

    // Função chamada quando o usuário clica em "Pedir orçamento no WhatsApp"
    function aoEnviarFormulario(evento) {
        evento.preventDefault(); // Impede o recarregamento da página

        // Validação: serviços e campos obrigatórios
        if (!validarFormulario()) return;

        // Abre o WhatsApp em nova aba; "noopener" protege a página original
        const link = criarLinkWhatsApp(gerarMensagemWhatsApp());
        window.open(link, '_blank', 'noopener,noreferrer');
    }

    // Completa todos os links de WhatsApp (botão flutuante e rodapé) com uma mensagem padrão
    function configurarLinksWhatsApp() {
        const mensagemPadrao = 'Olá, ' + nomeEmpresa + '! Vim pelo site e gostaria de um orçamento.';
        document.querySelectorAll('.link-whatsapp').forEach(function (link) {
            link.href = criarLinkWhatsApp(mensagemPadrao);
        });
    }

    // Desenha a "ordem de serviço" ao vivo ao lado do formulário
    function atualizarOrdemServico() {
        const servicos = obterServicosSelecionados();
        listaOrdem.innerHTML = ''; // limpa a lista antes de redesenhar
        if (servicos.length === 0) {
            const vazio = document.createElement('li');
            vazio.className = 'vazio'; // sem quadradinho de check
            vazio.textContent = 'Marque um serviço e ele aparece aqui.';
            listaOrdem.appendChild(vazio);
        }
        servicos.forEach(function (servico) {
            const item = document.createElement('li');
            item.textContent = servico; // textContent evita injeção de HTML
            listaOrdem.appendChild(item);
        });
        const bairro = limparTexto(campoBairro.value);
        // Só mostra o que já foi preenchido (o prazo começa sem seleção)
        detalhesOrdem.textContent = [
            campoUrgencia.value ? 'Prazo: ' + campoUrgencia.value : '',
            bairro ? 'Bairro: ' + bairro : ''
        ].filter(Boolean).join(' · ');
    }

    // Carrossel de depoimentos: as setas avançam um cartão por vez.
    // Ao tentar passar do último, volta para o primeiro (e o contrário também).
    function configurarCarrosselDepoimentos() {
        const faixa = document.getElementById('faixa-depoimentos');
        const setaAnterior = document.getElementById('seta-anterior');
        const setaProxima = document.getElementById('seta-proxima');
        if (!faixa || !setaAnterior || !setaProxima) return;

        const margemErro = 4; // tolerância (em pixels) para saber se chegou ao início ou ao fim

        // Distância de um cartão até o próximo: largura do cartão + espaço entre eles
        function calcularPasso() {
            const cartao = faixa.querySelector('.depoimento');
            const espaco = parseFloat(getComputedStyle(faixa).columnGap) || 0;
            return cartao.getBoundingClientRect().width + espaco;
        }

        // Quanto a faixa ainda pode rolar para a direita
        function calcularLimite() {
            return faixa.scrollWidth - faixa.clientWidth;
        }

        setaProxima.addEventListener('click', function () {
            if (faixa.scrollLeft >= calcularLimite() - margemErro) {
                faixa.scrollTo({ left: 0 }); // chegou no último: volta ao primeiro
            } else {
                faixa.scrollBy({ left: calcularPasso() });
            }
        });

        setaAnterior.addEventListener('click', function () {
            if (faixa.scrollLeft <= margemErro) {
                faixa.scrollTo({ left: calcularLimite() }); // está no primeiro: vai ao último
            } else {
                faixa.scrollBy({ left: -calcularPasso() });
            }
        });
    }

    // Animações de entrada: cada bloco aparece suavemente quando chega na tela do visitante
    function configurarAnimacoesEntrada() {
        // Sem suporte do navegador ou com "reduzir movimento" ativo, a página fica estática
        const prefereSemMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!('IntersectionObserver' in window) || prefereSemMovimento) return;

        // Lista de [seletor, classe extra opcional] dos elementos que vão animar
        const grupos = [
            ['.secao h2', 'revelar-titulo'],
            ['.secao-introducao', ''],
            ['.cartao-servico', ''],
            ['.area-orcamento .ordem-servico', ''],
            ['.passos li', ''],
            ['.selos li', ''],
            ['#faixa-depoimentos', ''],
            ['.controles-carrossel', ''],
            ['details', ''],
            ['.rodape-grade > *', '']
        ];

        // O observador avisa quando um elemento entra na tela; então ele ganha a classe "visivel"
        const observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (!entrada.isIntersecting) return;
                entrada.target.classList.add('visivel');
                observador.unobserve(entrada.target); // anima só uma vez
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

        grupos.forEach(function (grupo) {
            document.querySelectorAll(grupo[0]).forEach(function (elemento, indice) {
                elemento.classList.add('revelar');
                if (grupo[1]) elemento.classList.add(grupo[1]);
                // Pequeno atraso escalonado: itens vizinhos entram um após o outro
                elemento.style.setProperty('--atraso', (indice % 4) * 90 + 'ms');
                observador.observe(elemento);
            });
        });
    }

    // ---------- Inicialização: liga cada função ao seu evento ----------
    formularioOrcamento.addEventListener('submit', aoEnviarFormulario);
    formularioOrcamento.addEventListener('change', atualizarResumoSelecao);
    // 'input' reage também enquanto o cliente digita
    formularioOrcamento.addEventListener('input', atualizarOrdemServico);
    formularioOrcamento.addEventListener('change', atualizarOrdemServico);
    atualizarOrdemServico();
    configurarLimpezaDeErros();
    configurarLinksWhatsApp();
    configurarCarrosselDepoimentos();
    configurarAnimacoesEntrada();
})();