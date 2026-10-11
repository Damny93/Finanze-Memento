// ============================================================
// FINANZE
// MODULO AZIONI OPERATIVE
// FILE ESTERNO
// VERSIONE 0.12-E
// ============================================================
//
// BASE:
// Azioni operative estratte da finanze-dashboard.js v0.12-D
//
// SCOPO:
// - Nuova Transazione
// - Nuova Spesa Fissa
// - Nuova Entrata Fissa
// - Nuovo Check Saldo
// - Verifica Entrate
// - Aggiungi Entrata durante la riconciliazione
//
// NESSUNA MODIFICA ALLA LOGICA VALIDATA.
//
// API PUBBLICA:
// FinanzeAzioni.apriNuovaTransazione(contexto)
// FinanzeAzioni.apriNuovaSpesaFissa(contexto)
// FinanzeAzioni.apriNuovaEntrataFissa(contexto)
// FinanzeAzioni.apriCheckSaldo(contexto)
// FinanzeAzioni.apriSelezioneVerificaEntrate(contexto)
//
// DIPENDENZE:
// - moment.min.js
// - finanze-core.js
// - finanze-motore.js tramite ricalcolaMotore del contexto
// ============================================================

var FinanzeAzioni = (function() {

    var libSaldo = null;
    var libTransazioni = null;
    var libSpeseFisse = null;
    var libEntrateFisse = null;

    var checks = null;
    var contiAttivi = null;
    var avviso = null;
    var ricalcolaMotore = null;

    var arrotonda2 = null;
    var numero = null;
    var dataOraBreve = null;
    var dataOraEditor = null;
    var parseImporto = null;
    var formattaEuro = null;
    var relazioni = null;
    var contieneElemento = null;
    var etichettaConto = null;

    var TESTO = "#222222";
    var SECONDARIO = "#777777";
    var BLU = "#3F51B5";


    // ========================================================
    // 1. UI BASE
    // ========================================================

    function testo(
        valore,
        dimensione,
        colore,
        stile
    ) {
        return ui()
            .text(
                String(valore)
            )
            .font({
                size: dimensione,
                color: colore,
                style: stile || "normal"
            });
    }


    function spazio(altezza) {
        return ui()
            .text("")
            .height(altezza);
    }


    // ========================================================
    // 2. CONFIGURA CONTESTO
    // ========================================================

    function configura(contexto) {

        var ctx =
            contexto || {};

        libSaldo =
            ctx.libSaldo;

        libTransazioni =
            ctx.libTransazioni;

        libSpeseFisse =
            ctx.libSpeseFisse;

        libEntrateFisse =
            ctx.libEntrateFisse;

        checks =
            ctx.checks || [];

        contiAttivi =
            ctx.contiAttivi;

        avviso =
            ctx.avviso;

        ricalcolaMotore =
            ctx.ricalcolaMotore;


        if (
            typeof FinanzeCore ==
            "undefined"
        ) {
            throw (
                "finanze-core.js non disponibile."
            );
        }

        if (
            typeof contiAttivi !=
            "function"
        ) {
            throw (
                "contiAttivi() non disponibile."
            );
        }

        if (
            typeof avviso !=
            "function"
        ) {
            throw (
                "avviso() non disponibile."
            );
        }

        if (
            typeof ricalcolaMotore !=
            "function"
        ) {
            throw (
                "ricalcolaMotore() non disponibile."
            );
        }


        arrotonda2 =
            FinanzeCore.arrotonda2;

        numero =
            FinanzeCore.numero;

        dataOraBreve =
            FinanzeCore.dataOraBreve;

        dataOraEditor =
            FinanzeCore.dataOraEditor;

        parseImporto =
            FinanzeCore.parseImporto;

        formattaEuro =
            FinanzeCore.formattaEuro;

        relazioni =
            FinanzeCore.relazioni;

        contieneElemento =
            FinanzeCore.contieneElemento;

        etichettaConto =
            FinanzeCore.etichettaConto;
    }

    // 3. ENTRATE VERIFICATE
    // ========================================================

    function leggiEntrateVerificate(
        check
    ) {
        var valore =
            String(
                check.field(
                    "Entrate Verificate"
                ) || ""
            )
            .trim()
            .toUpperCase();

        return (
            valore ==
            "SI"
        );
    }
    function impostaEntrateVerificate(
        check,
        valore
    ) {
        check.set(
            "Entrate Verificate",
            valore === true
                ? "SI"
                : "NO"
        );
    }


    // ========================================================
    // 4. ORDINE CRONOLOGICO
    // ========================================================

    function timestampVoce(
        voce
    ) {
        var data =
            voce.field(
                "Data e Ora"
            );

        if (!data) {
            return 0;
        }

        return moment(data)
            .toDate()
            .getTime();
    }

    function ordinaCronologicamente(
        a,
        b
    ) {
        var ta =
            timestampVoce(a);

        var tb =
            timestampVoce(b);

        if (ta < tb) {
            return -1;
        }

        if (ta > tb) {
            return 1;
        }

        var ida =
            String(a.id || "");

        var idb =
            String(b.id || "");

        if (ida < idb) {
            return -1;
        }

        if (ida > idb) {
            return 1;
        }

        return 0;
    }


    // ========================================================
    // 5. NOME MOVIMENTO
    // ========================================================

    function nomeMovimento(
        voce
    ) {
        var nome =
            voce.field(
                "Transazione"
            );

        if (!nome) {
            nome =
                voce.field(
                    "Descrizione"
                );
        }

        if (!nome) {
            nome =
                "Entrata";
        }

        return String(nome);
    }


    // ========================================================
    // 6. NUOVA TRANSAZIONE
    // ========================================================

    function apriNuovaTransazione() {

        var listaConti =
            contiAttivi();

        if (
            listaConti.length == 0
        ) {
            avviso(
                "Nuova Transazione",
                "Non ci sono conti attivi."
            );

            return true;
        }

        var opzioniConti = [];

        for (
            var i = 0;
            i < listaConti.length;
            i++
        ) {
            opzioniConti.push(
                etichettaConto(
                    listaConti[i]
                )
            );
        }

        var sceltaConto =
            ui()
            .choiceBox(
                0,
                opzioniConti
            );

        var sceltaTipo =
            ui()
            .choiceBox(
                0,
                [
                    "Uscita",
                    "Entrata"
                ]
            );

        var campoNome =
            ui()
            .edit("");

        var campoDescrizione =
            ui()
            .edit("");

        var campoImporto =
            ui()
            .edit("");

        var campoDataOra =
            ui()
            .edit(
                dataOraEditor(
                    new Date()
                        .getTime()
                )
            );

        var vista =
            ui()
            .layout([

                testo(
                    "CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaConto,

                spazio(6),

                testo(
                    "TIPO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaTipo,

                spazio(6),

                testo(
                    "TRANSAZIONE",
                    10,
                    BLU,
                    "bold"
                ),

                campoNome,

                spazio(6),

                testo(
                    "DESCRIZIONE",
                    10,
                    BLU,
                    "bold"
                ),

                campoDescrizione,

                spazio(6),

                testo(
                    "IMPORTO (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoImporto,

                spazio(6),

                testo(
                    "DATA E ORA",
                    10,
                    BLU,
                    "bold"
                ),

                campoDataOra,

                testo(
                    "Formato: GG/MM/AAAA HH:mm",
                    9,
                    SECONDARIO
                )

            ])
            .width_match_parent();

        dialog()
            .title(
                "＋ Nuova Transazione"
            )
            .view(vista)
            .positiveButton(
                "REGISTRA",
                function() {

                    var posizioneConto =
                        sceltaConto.selected;

                    if (
                        posizioneConto < 0 ||
                        posizioneConto >=
                        listaConti.length
                    ) {
                        return false;
                    }

                    var contoScelto =
                        listaConti[
                            posizioneConto
                        ];

                    var posizioneTipo =
                        sceltaTipo.selected;

                    var tipo =
                        posizioneTipo == 1
                            ? "Entrata"
                            : "Uscita";

                    var nome =
                        String(
                            campoNome.text || ""
                        )
                        .trim();

                    if (!nome) {
                        return false;
                    }

                    var descrizione =
                        String(
                            campoDescrizione.text || ""
                        )
                        .trim();

                    var importo =
                        parseImporto(
                            campoImporto.text
                        );

                    if (
                        importo === null ||
                        importo <= 0
                    ) {
                        return false;
                    }

                    importo =
                        Math.abs(
                            arrotonda2(
                                importo
                            )
                        );
                    var momentoMovimento =
                        moment(
                            String(
                                campoDataOra.text || ""
                            ).trim(),
                            "DD/MM/YYYY HH:mm",
                            true
                        );

                    if (
                        !momentoMovimento.isValid()
                    ) {
                        return false;
                    }

                    var categoria =
                        tipo == "Entrata"
                            ? "Entrata Extra"
                            : "Altre Spese";

                    var nuovaTransazione =
                        libTransazioni.create({

                            "Transazione":
                                nome,

                            "Descrizione":
                                descrizione,

                            "Data e Ora":
                                momentoMovimento
                                    .toDate()
                                    .getTime(),

                            "Importo":
                                importo,

                            "Tipo":
                                tipo,

                            "Categoria":
                                categoria,

                            "Origine":
                                "Manuale"

                        });

                    if (!nuovaTransazione) {
                        return false;
                    }

                    nuovaTransazione.link(
                        "Conto",
                        contoScelto
                    );

                    ricalcolaMotore();

                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();

        return false;
    }


    // ========================================================
    // 7. NUOVA SPESA FISSA
    // ========================================================

    function apriNuovaSpesaFissa() {

        var listaConti =
            contiAttivi();

        if (
            listaConti.length == 0
        ) {
            avviso(
                "Nuova Spesa Fissa",
                "Non ci sono conti attivi."
            );

            return true;
        }

        var opzioniConti = [];

        for (
            var i = 0;
            i < listaConti.length;
            i++
        ) {
            opzioniConti.push(
                etichettaConto(
                    listaConti[i]
                )
            );
        }

        var opzioniCadenza =
            [
                "Mese [1]",
                "Mesi [2]",
                "Mesi [3]",
                "Mesi [4]",
                "Mesi [5]",
                "Mesi [6]",
                "Anni [1]",
                "Anni [2]",
                "Anni [3]"
            ];

        var sceltaConto =
            ui()
            .choiceBox(
                0,
                opzioniConti
            );

        var campoNome =
            ui()
            .edit("");

        var campoDescrizione =
            ui()
            .edit("");

        var campoImporto =
            ui()
            .edit("");

        var sceltaCadenza =
            ui()
            .choiceBox(
                0,
                opzioniCadenza
            );
        var campoPrimaScadenza =
            ui()
            .edit(
                moment()
                    .format(
                        "DD/MM/YYYY"
                    )
            );

        var vista =
            ui()
            .layout([

                testo(
                    "CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaConto,

                spazio(6),

                testo(
                    "NOME SPESA",
                    10,
                    BLU,
                    "bold"
                ),

                campoNome,

                spazio(6),

                testo(
                    "DESCRIZIONE",
                    10,
                    BLU,
                    "bold"
                ),
                campoDescrizione,

                spazio(6),

                testo(
                    "IMPORTO RATA (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoImporto,

                spazio(6),

                testo(
                    "CADENZA",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaCadenza,

                spazio(6),

                testo(
                    "PRIMA SCADENZA",
                    10,
                    BLU,
                    "bold"
                ),

                campoPrimaScadenza,

                testo(
                    "Formato: GG/MM/AAAA",
                    9,
                    SECONDARIO
                )

            ])
            .width_match_parent();

        dialog()
            .title(
                "↓ Nuova Spesa Fissa"
            )
            .view(vista)
            .positiveButton(
                "REGISTRA",
                function() {

                    var posizioneConto =
                        sceltaConto.selected;

                    if (
                        posizioneConto < 0 ||
                        posizioneConto >=
                        listaConti.length
                    ) {
                        return false;
                    }

                    var contoScelto =
                        listaConti[
                            posizioneConto
                        ];

                    var nome =
                        String(
                            campoNome.text || ""
                        )
                        .trim();

                    if (!nome) {
                        return false;
                    }

                    var descrizione =
                        String(
                            campoDescrizione.text || ""
                        )
                        .trim();

                    var importo =
                        parseImporto(
                            campoImporto.text
                        );

                    if (
                        importo === null ||
                        importo <= 0
                    ) {
                        return false;
                    }

                    importo =
                        Math.abs(
                            arrotonda2(
                                importo
                            )
                        );

                    var indiceCadenza =
                        sceltaCadenza.selected;

                    if (
                        indiceCadenza < 0 ||
                        indiceCadenza >=
                        opzioniCadenza.length
                    ) {
                        return false;
                    }

                    var cadenza =
                        opzioniCadenza[
                            indiceCadenza
                        ];

                    var momentoScadenza =
                        moment(
                            String(
                                campoPrimaScadenza.text || ""
                            ).trim(),
                            "DD/MM/YYYY",
                            true
                        );

                    if (
                        !momentoScadenza.isValid()
                    ) {
                        return false;
                    }

                    var timestampScadenza =
                        momentoScadenza
                            .startOf(
                                "day"
                            )
                            .toDate()
                            .getTime();var nuovaSpesa =
                        libSpeseFisse.create({

                            "Nome Spesa":
                                nome,
                            "Descrizione":
                                descrizione,

                            "Importo Rata":
                                importo,

                            "Cadenza Rata":
                                cadenza,

                            "Prima Scadenza":
                                timestampScadenza

                        });

                    if (!nuovaSpesa) {
                        return false;
                    }

                    nuovaSpesa.link(
                        "Conto",
                        contoScelto
                    );

                    var prossima =
                        nuovaSpesa.field(
                            "Prossima Scadenza"
                        );

                    if (!prossima) {
                        nuovaSpesa.set(
                            "Prossima Scadenza",
                            timestampScadenza
                        );

                        prossima =
                            timestampScadenza;
                    }

                    var statoAttuale =
                        String(
                            nuovaSpesa.field(
                                "Stato Rata"
                            ) || ""
                        )
                        .trim();

                    if (
                        statoAttuale == ""
                    ) {
                        var giorni =
                            moment(prossima)
                                .startOf("day")
                                .diff(
                                    moment()
                                        .startOf("day"),
                                    "days"
                                );

                        var stato;

                        if (giorni < 0) {
                            stato =
                                "🔴 PAGAMENTO DA CONFERMARE";

                        } else if (
                            giorni == 0
                        ) {
                            stato =
                                "🔴 DA PAGARE OGGI";

                        } else if (
                            giorni == 1
                        ) {
                            stato =
                                "🟠 DA PAGARE DOMANI";

                        } else {
                            stato =
                                "🟢 TRA " +
                                giorni +
                                " GIORNI";
                        }

                        nuovaSpesa.set(
                            "Stato Rata",
                            stato
                        );
                    }

                    ricalcolaMotore();

                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();

        return false;
    }

    // ========================================================
    // 8. NUOVA ENTRATA FISSA
    // ========================================================

    function apriNuovaEntrataFissa() {

        if (!libEntrateFisse) {
            avviso(
                "Nuova Entrata Fissa",
                "La libreria [■] Entrate Fisse non è accessibile."
            );

            return true;
        }

        var listaConti =
            contiAttivi();

        if (
            listaConti.length == 0
        ) {
            avviso(
                "Nuova Entrata Fissa",
                "Non ci sono conti attivi."
            );

            return true;
        }

        var opzioniConti = [];

        for (
            var i = 0;
            i < listaConti.length;
            i++
        ) {
            opzioniConti.push(
                etichettaConto(
                    listaConti[i]
                )
            );
        }

        var opzioniCadenza =
            [
                "Mese [1]",
                "Mesi [2]",
                "Mesi [3]",
                "Mesi [4]",
                "Mesi [5]",
                "Mesi [6]",
                "Anni [1]",
                "Anni [2]",
                "Anni [3]"
            ];

        var sceltaConto =
            ui()
            .choiceBox(
                0,
                opzioniConti
            );

        var campoNome =
            ui()
            .edit("");

        var campoDescrizione =
            ui()
            .edit("");

        var campoImporto =
            ui()
            .edit("");

        var sceltaCadenza =
            ui()
            .choiceBox(
                0,
                opzioniCadenza
            );

        var campoPrimaEntrata =
            ui()
            .edit(
                moment()
                    .format(
                        "DD/MM/YYYY"
                    )
            );

        var vista =
            ui()
            .layout([

                testo(
                    "CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaConto,
                spazio(6),

                testo(
                    "NOME ENTRATA",
                    10,
                    BLU,
                    "bold"
                ),

                campoNome,

                spazio(6),

                testo(
                    "DESCRIZIONE",
                    10,
                    BLU,
                    "bold"
                ),

                campoDescrizione,

                spazio(6),

                testo(
                    "IMPORTO PREVISTO (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoImporto,

                spazio(6),

                testo(
                    "CADENZA",
                    10,
                    BLU,
                    "bold"
                ),
                sceltaCadenza,

                spazio(6),

                testo(
                    "PRIMA ENTRATA",
                    10,
                    BLU,
                    "bold"
                ),

                campoPrimaEntrata,

                testo(
                    "Formato: GG/MM/AAAA",
                    9,
                    SECONDARIO
                )

            ])
            .width_match_parent();

        dialog()
            .title(
                "↑ Nuova Entrata Fissa"
            )
            .view(vista)
            .positiveButton(
                "REGISTRA",
                function() {

                    var posizioneConto =
                        sceltaConto.selected;

                    if (
                        posizioneConto < 0 ||
                        posizioneConto >=
                        listaConti.length
                    ) {
                        return false;
                    }
                    var contoScelto =
                        listaConti[
                            posizioneConto
                        ];

                    var nome =
                        String(
                            campoNome.text || ""
                        )
                        .trim();

                    if (!nome) {
                        return false;
                    }

                    var descrizione =
                        String(
                            campoDescrizione.text || ""
                        )
                        .trim();
                    var importo =
                        parseImporto(
                            campoImporto.text
                        );

                    if (
                        importo === null ||
                        importo <= 0
                    ) {
                        return false;
                    }

                    importo =
                        Math.abs(
                            arrotonda2(
                                importo
                            )
                        );

                    var indiceCadenza =
                        sceltaCadenza.selected;

                    if (
                        indiceCadenza < 0 ||
                        indiceCadenza >=
                        opzioniCadenza.length
                    ) {
                        return false;
                    }

                    var cadenza =
                        opzioniCadenza[
                            indiceCadenza
                        ];

                    var momentoPrimaEntrata =
                        moment(
                            String(
                                campoPrimaEntrata.text || ""
                            ).trim(),
                            "DD/MM/YYYY",
                            true
                        );

                    if (
                        !momentoPrimaEntrata.isValid()
                    ) {
                        return false;
                    }

                    var timestampPrimaEntrata =
                        momentoPrimaEntrata
                            .startOf("day")
                            .toDate()
                            .getTime();

                    var nuovaEntrata =
                        libEntrateFisse.create({

                            "Entrata":
                                nome,

                            "Descrizione":
                                descrizione,

                            "Importo Previsto":
                                importo,

                            "Cadenza":
                                cadenza,

                            "Prima Entrata":
                                timestampPrimaEntrata

                        });

                    if (!nuovaEntrata) {
                        return false;
                    }

                    nuovaEntrata.link(
                        "Conto",
                        contoScelto
                    );

                    var prossima =
                        nuovaEntrata.field(
                            "Prossima Entrata"
                        );

                    if (!prossima) {
                        nuovaEntrata.set(
                            "Prossima Entrata",
                            timestampPrimaEntrata
                        );

                        prossima =
                            timestampPrimaEntrata;
                    }

                    var statoAttuale =
                        String(
                            nuovaEntrata.field(
                                "Stato Entrata"
                            ) || ""
                        )
                        .trim();

                    if (
                        statoAttuale == ""
                    ) {
                        var giorni =
                            moment(prossima)
                                .startOf("day")
                                .diff(
                                    moment()
                                        .startOf("day"),
                                    "days"
                                );

                        var stato;

                        if (giorni < 0) {
                            stato =
                                "🔴 ENTRATA DA CONFERMARE";
                        } else if (
                            giorni == 0
                        ) {
                            stato =
                                "🔴 DA RICEVERE OGGI";

                        } else if (
                            giorni == 1
                        ) {
                            stato =
                                "🟠 DA RICEVERE DOMANI";

                        } else {
                            stato =
                                "🟢 TRA " +
                                giorni +
                                " GIORNI";
                        }

                        nuovaEntrata.set(
                            "Stato Entrata",
                            stato
                        );
                    }

                    ricalcolaMotore();

                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();

        return false;
    }

    // ========================================================
    // 9. NUOVO CHECK SALDO
    // ========================================================

    function apriCheckSaldo() {

        var listaConti =
            contiAttivi();

        if (
            listaConti.length == 0
        ) {
            avviso(
                "Check Saldo",
                "Non ci sono conti attivi."
            );

            return true;
        }

        var opzioni = [];

        for (
            var i = 0;
            i < listaConti.length;
            i++
        ) {
            opzioni.push(
                etichettaConto(
                    listaConti[i]
                )
            );
        }

        var sceltaConto =
            ui()
            .choiceBox(
                0,
                opzioni
            );

        var editorSaldo =
            ui()
            .edit("");

        var vista =
            ui()
            .layout([

                testo(
                    "CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaConto,

                spazio(8),

                testo(
                    "DISPONIBILITÀ REALE",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    "Inserisci il saldo mostrato dalla banca.",
                    9,
                    SECONDARIO
                ),

                editorSaldo

            ])
            .width_match_parent();

        dialog()
            .title(
                "✓ Nuovo Check Saldo"
            )
            .view(vista)
            .positiveButton(
                "REGISTRA",
                function() {

                    var posizione =
                        sceltaConto.selected;

                    if (
                        posizione < 0 ||
                        posizione >=
                        listaConti.length
                    ) {
                        return false;
                    }

                    var contoScelto =
                        listaConti[
                            posizione
                        ];

                    var valore =
                        parseImporto(
                            editorSaldo.text
                        );

                    if (
                        valore === null
                    ) {
                        return false;
                    }

                    var nuovoCheck =
                        libSaldo.create({

                            "Disponibilità Netta":
                                valore,

                            "Data e Ora":
                                new Date()
                                    .getTime(),

                            "Conto":
                                [
                                    contoScelto
                                ]

                        });

                    if (!nuovoCheck) {
                        return false;
                    }

                    nuovoCheck.set(
                        "Entrate Verificate",
                        "NO"
                    );

                    ricalcolaMotore();

                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();

        return false;
    }


    // ========================================================
    // 10. CHECK DA VERIFICARE
    // ========================================================

    function listaCheckDaVerificare() {

        var risultato = [];

        for (
            var i = 0;
            i < checks.length;
            i++
        ) {
            var check =
                checks[i];

            var verificato =
                leggiEntrateVerificate(
                    check
                );

            var stato =
                String(
                    check.field(
                        "Stato di Riconciliazione"
                    ) || ""
                );

            if (
                verificato &&
                stato == "OK"
            ) {
                continue;
            }

            risultato.push(
                check
            );
        }

        risultato.sort(
            function(
                a,
                b
            ) {
                return (
                    timestampVoce(b) -
                    timestampVoce(a)
                );
            }
        );

        return risultato;
    }


    // ========================================================
    // 11. SELETTORE VERIFICA ENTRATE
    // ========================================================

    function apriSelezioneVerificaEntrate() {

        var lista =
            listaCheckDaVerificare();

        if (
            lista.length == 0
        ) {
            avviso(
                "Verifica Entrate",
                "Non ci sono Check da verificare."
            );

            return true;
        }

        var opzioni = [];

        for (
            var i = 0;
            i < lista.length;
            i++
        ) {
            var relConto =
                relazioni(
                    lista[i].field(
                        "Conto"
                    )
                );

            var nomeConto =
                relConto.length > 0
                    ? etichettaConto(
                        relConto[0]
                    )
                    : "Conto non definito";

            var stato =
                String(
                    lista[i].field(
                        "Stato di Riconciliazione"
                    ) ||
                    "Da verificare"
                );

            opzioni.push(
                nomeConto +
                " · " +
                dataOraBreve(
                    lista[i].field(
                        "Data e Ora"
                    )
                ) +
                " · " +
                stato
            );
        }

        var scelta =
            ui()
            .choiceBox(
                0,
                opzioni
            );

        dialog()
            .title(
                "✓ Verifica Entrate"
            )
            .view(
                ui()
                    .layout([

                        testo(
                            "CHECK DA VERIFICARE",
                            10,
                            BLU,
                            "bold"
                        ),

                        spazio(3),

                        scelta

                    ])
                    .width_match_parent()
            )
            .positiveButton(
                "APRI",
                function() {

                    var indice =
                        scelta.selected;

                    if (
                        indice < 0 ||
                        indice >=
                        lista.length
                    ) {
                        return false;
                    }

                    verificaEntrate(
                        lista[
                            indice
                        ]
                    );

                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();
        return false;
    }


    // ========================================================
    // 12. VERIFICA ENTRATE
    // ========================================================

    function verificaEntrate(
        checkCorrente
    ) {

        var relazioniConto =
            relazioni(
                checkCorrente.field(
                    "Conto"
                )
            );

        if (
            relazioniConto.length == 0
        ) {
            avviso(
                "Verifica Entrate",
                "Il Check non ha un Conto associato."
            );

            return;
        }

        var conto =
            relazioniConto[0];

        var idConto =
            conto.id;

        var tuttiCheck =
            libSaldo.entries();

        var checkConto =
            [];
        for (
            var c = 0;
            c < tuttiCheck.length;
            c++
        ) {
            var voceCheck =
                tuttiCheck[c];

            if (
                !contieneElemento(
                    voceCheck.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {
                continue;
            }

            if (
                !voceCheck.field(
                    "Data e Ora"
                )
            ) {
                continue;
            }

            checkConto.push(
                voceCheck
            );
        }

        checkConto.sort(
            ordinaCronologicamente
        );

        var indiceCorrente =
            -1;

        for (
            var ci = 0;
            ci < checkConto.length;
            ci++
        ) {
            if (
                checkConto[ci].id ==
                checkCorrente.id
            ) {
                indiceCorrente =
                    ci;

                break;
            }
        }

        if (
            indiceCorrente < 0
        ) {
            avviso(
                "Verifica Entrate",
                "Impossibile individuare il Check nella sequenza del Conto."
            );
            return;
        }

        if (
            indiceCorrente == 0
        ) {
            impostaEntrateVerificate(
                checkCorrente,
                true
            );

            checkCorrente.set(
                "Differenza da giustificare",
                0
            );

            checkCorrente.set(
                "Stato di Riconciliazione",
                "OK"
            );
            ricalcolaMotore();

            avviso(
                "Baseline impostata",
                "Questo è il primo Check del Conto.\n\n" +
                "È stato impostato automaticamente come baseline."
            );

            return;
        }

        var checkPrecedente =
            checkConto[
                indiceCorrente - 1
            ];

        if (
            !leggiEntrateVerificate(
                checkPrecedente
            ) ||
            String(
                checkPrecedente.field(
                    "Stato di Riconciliazione"
                ) || ""
            ) != "OK"
        ) {
            impostaEntrateVerificate(
                checkCorrente,
                false
            );

            checkCorrente.set(
                "Stato di Riconciliazione",
                "CHECK PRECEDENTE DA CHIUDERE"
            );

            avviso(
                "Check precedente",
                "Prima devi chiudere il Check precedente."
            );

            return;
        }

        if (
            leggiEntrateVerificate(
                checkCorrente
            ) &&
            String(
                checkCorrente.field(
                    "Stato di Riconciliazione"
                ) || ""
            ) ==
            "OK"
        ) {
            avviso(
                "Verifica Entrate",
                "Questo Check è già verificato e riconciliato."
            );

            return;
        }

        function calcolaRiepilogo() {

            var momentoPrecedente =
                moment(
                    checkPrecedente.field(
                        "Data e Ora"
                    )
                );

            var momentoCorrente =
                moment(
                    checkCorrente.field(
                        "Data e Ora"
                    )
                );

            var saldoPrecedente =
                numero(
                    checkPrecedente.field(
                        "Disponibilità Netta"
                    )
                );

            var saldoCorrente =
                numero(
                    checkCorrente.field(
                        "Disponibilità Netta"
                    )
                );

            var entrate =
                0;

            var uscite =
                0;

            var elencoEntrate =
                [];

            var movimenti =
                libTransazioni.entries();

            for (
                var m = 0;
                m < movimenti.length;
                m++
            ) {
                var movimento =
                    movimenti[m];

                if (
                    !contieneElemento(
                        movimento.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {
                    continue;
                }

                if (
                    movimento.field(
                        "Origine"
                    ) ==
                        "Calcolata" &&
                    movimento.field(
                        "Categoria"
                    ) ==
                        "Altre Spese"
                ) {
                    continue;
                }

                var dataMovimento =
                    movimento.field(
                        "Data e Ora"
                    );

                if (!dataMovimento) {
                    continue;
                }
                var momentoMovimento =
                    moment(
                        dataMovimento
                    );

                if (
                    !momentoMovimento.isAfter(
                        momentoPrecedente
                    ) ||
                    momentoMovimento.isAfter(
                        momentoCorrente
                    )
                ) {
                    continue;
                }

                var importo =
                    numero(
                        movimento.field(
                            "Importo"
                        )
                    );

                var tipo =
                    movimento.field(
                        "Tipo"
                    );

                if (
                    tipo ==
                    "Entrata"
                ) {
                    entrate +=
                        importo;

                    elencoEntrate.push({
                        nome:
                            nomeMovimento(
                                movimento
                            ),
                        importo:
                            importo
                    });

                } else if (
                    tipo ==
                    "Uscita"
                ) {
                    uscite +=
                        importo;
                }
            }

            entrate =
                arrotonda2(
                    entrate
                );

            uscite =
                arrotonda2(
                    uscite
                );
            var saldoAtteso =
                arrotonda2(
                    saldoPrecedente +
                    entrate -
                    uscite
                );

            var residuo =
                arrotonda2(
                    saldoCorrente -
                    saldoAtteso
                );

            return {
                momentoPrecedente:
                    momentoPrecedente,
                momentoCorrente:
                    momentoCorrente,
                saldoPrecedente:
                    saldoPrecedente,
                saldoCorrente:
                    saldoCorrente,
                entrate:
                    entrate,
                uscite:
                    uscite,
                saldoAtteso:
                    saldoAtteso,
                residuo:
                    residuo,
                elencoEntrate:
                    elencoEntrate
            };
        }


        function testoRiepilogo(
            dati
        ) {

            var t =
                "Periodo\n" +
                dati.momentoPrecedente
                    .format(
                        "DD/MM HH:mm"
                    ) +
                "  →  " +
                dati.momentoCorrente
                    .format(
                        "DD/MM HH:mm"
                    ) +
                "\n\n" +
                "Saldo precedente: " +
                formattaEuro(
                    dati.saldoPrecedente
                ) +
                "\n" +
                "Saldo rilevato: " +
                formattaEuro(
                    dati.saldoCorrente
                ) +
                "\n\n" +
                "ENTRATE REGISTRATE";

            if (
                dati.elencoEntrate.length == 0
            ) {
                t +=
                    "\nNessuna";

            } else {
                var massimo =
                    Math.min(
                        dati.elencoEntrate.length,
                        8
                    );

                for (
                    var e = 0;
                    e < massimo;
                    e++
                ) {
                    t +=
                        "\n+ " +
                        formattaEuro(
                            dati.elencoEntrate[e]
                                .importo
                        ) +
                        "  " +
                        dati.elencoEntrate[e]
                            .nome;
                }

                if (
                    dati.elencoEntrate.length >
                    massimo
                ) {
                    t +=
                        "\n... +" +
                        (
                            dati.elencoEntrate.length -
                            massimo
                        ) +
                        " altre";
                }
            }

            t +=
                "\n--------------------" +
                "\nTotale entrate: +" +
                formattaEuro(
                    dati.entrate
                ) +
                "\n\nUscite già registrate: -" +
                formattaEuro(
                    dati.uscite
                ) +
                "\n\nSaldo atteso: " +
                formattaEuro(
                    dati.saldoAtteso
                );

            if (
                dati.residuo < 0
            ) {
                t +=
                    "\n\nSpese non registrate stimate: " +
                    formattaEuro(
                        Math.abs(
                            dati.residuo
                        )
                    );

            } else if (
                dati.residuo > 0
            ) {
                t +=
                    "\n\n⚠ Entrate mancanti: " +
                    formattaEuro(
                        dati.residuo
                    );

            } else {
                t +=
                    "\n\nNessuna differenza da giustificare.";
            }
            return t;
        }


        function apriAggiungiEntrata() {

            var campoNome =
                ui()
                .edit("");

            var campoImporto =
                ui()
                .edit("");

            var campoDataOra =
                ui()
                .edit(
                    moment(
                        checkCorrente.field(
                            "Data e Ora"
                        )
                    )
                    .format(
                        "DD/MM/YYYY HH:mm"
                    )
                );

            dialog()
                .title(
                    "Aggiungi entrata"
                )
                .view(
                    ui()
                        .layout([

                            testo(
                                "Nome entrata",
                                10,
                                TESTO,
                                "bold"
                            ),
                            campoNome,

                            spazio(5),

                            testo(
                                "Importo (€)",
                                10,
                                TESTO,
                                "bold"
                            ),

                            campoImporto,

                            spazio(5),

                            testo(
                                "Data e ora movimento",
                                10,
                                TESTO,
                                "bold"
                            ),

                            campoDataOra,

                            testo(
                                "Formato: GG/MM/AAAA HH:mm",
                                9,
                                SECONDARIO
                            )

                        ])
                )
                .positiveButton(
                    "REGISTRA",
                    function() {

                        var nome =
                            String(
                                campoNome.text || ""
                            )
                            .trim();
                        var importo =
                            parseImporto(
                                campoImporto.text
                            );

                        if (
                            !nome ||
                            importo === null ||
                            importo <= 0
                        ) {
                            return false;
                        }

                        var momentoEntrata =
                            moment(
                                String(
                                    campoDataOra.text || ""
                                ).trim(),
                                "DD/MM/YYYY HH:mm",true
                            );
                        if (
                            !momentoEntrata.isValid()
                        ) {
                            return false;
                        }

                        var limitePrecedente =
                            moment(
                                checkPrecedente.field(
                                    "Data e Ora"
                                )
                            );

                        var limiteCorrente =
                            moment(
                                checkCorrente.field(
                                    "Data e Ora"
                                )
                            );

                        if (
                            !momentoEntrata.isAfter(
                                limitePrecedente
                            ) ||
                            momentoEntrata.isAfter(
                                limiteCorrente
                            )
                        ) {
                            avviso(
                                "Data non valida",
                                "La Data/Ora deve essere compresa tra:\n\n" +
                                limitePrecedente.format(
                                    "DD/MM/YYYY HH:mm"
                                ) +
                                "\n\ne\n\n" +
                                limiteCorrente.format(
                                    "DD/MM/YYYY HH:mm"
                                )
                            );

                            return false;
                        }

                        var timestampEntrata =
                            momentoEntrata
                                .toDate()
                                .getTime();

                        var timestampCheck =
                            limiteCorrente
                                .toDate()
                                .getTime();

                        if (
                            timestampEntrata ==
                            timestampCheck
                        ) {
                            timestampEntrata =
                                timestampCheck - 1;
                        }

                        var nuovaEntrata =
                            libTransazioni.create({

                                "Transazione":
                                    nome,

                                "Descrizione":
                                    nome,

                                "Data e Ora":
                                    timestampEntrata,

                                "Importo":
                                    arrotonda2(
                                        importo
                                    ),

                                "Tipo":
                                    "Entrata",

                                "Categoria":
                                    "Entrata Extra",
                                "Origine":
                                    "Manuale"

                            });

                        if (!nuovaEntrata) {
                            return false;
                        }

                        nuovaEntrata.link(
                            "Conto",
                            conto
                        );

                        nuovaEntrata.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );

                        impostaEntrateVerificate(
                            checkCorrente,
                            false
                        );

                        ricalcolaMotore();

                        avviso(
                            "Entrata registrata",
                            formattaEuro(
                                importo
                            ) +
                            "\n\nRiapri Verifica Entrate per controllare il nuovo riepilogo."
                        );

                        return true;
                    }
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .autoDismiss(false)
                .show();
        }


        var riepilogo =
            calcolaRiepilogo();

        dialog()
            .title(
                "Verifica Entrate"
            )
            .text(
                testoRiepilogo(
                    riepilogo
                )
            )
            .positiveButton(
                "TUTTE REGISTRATE",
                function() {

                    var datiAggiornati =
                        calcolaRiepilogo();

                    if (
                        datiAggiornati.residuo > 0
                    ) {
                        impostaEntrateVerificate(
                            checkCorrente,
                            false
                        );

                        checkCorrente.set(
                            "Differenza da giustificare",
                            datiAggiornati.residuo
                        );

                        checkCorrente.set(
                            "Stato di Riconciliazione",
                            "ENTRATE DA REGISTRARE"
                        );

                        ricalcolaMotore();

                        avviso(
                            "Entrate mancanti",
                            "Mancano ancora entrate per " +
                            formattaEuro(
                                datiAggiornati.residuo
                            ) +
                            "."
                        );

                        return true;
                    }

                    impostaEntrateVerificate(
                        checkCorrente,
                        true
                    );

                    ricalcolaMotore();

                    if (
                        datiAggiornati.residuo < 0
                    ) {
                        avviso(
                            "Check riconciliato",
                            "Altre Spese registrate: " +
                            formattaEuro(
                                Math.abs(
                                    datiAggiornati.residuo
                                )
                            )
                        );

                    } else {
                        avviso(
                            "Check riconciliato",
                            "Check riconciliato senza differenze."
                        );
                    }
                    return true;
                }
            )
            .neutralButton(
                "AGGIUNGI ENTRATA",
                function() {
                    apriAggiungiEntrata();
                    return true;
                }
            )
            .negativeButton(
                "NON ORA",
                function() {
                    return true;
                }
            )
            .show();
    }


    // ========================================================


    // ========================================================
    // 13. API PUBBLICA
    // ========================================================

    function esegui(
        contexto,
        titolo,
        funzione
    ) {

        try {

            configura(
                contexto
            );

            return funzione();

        } catch (errore) {

            if (
                contexto &&
                typeof contexto.avviso ==
                "function"
            ) {
                contexto.avviso(
                    titolo,
                    String(
                        errore
                    )
                );

            } else {
                dialog()
                    .title(
                        titolo
                    )
                    .text(
                        String(
                            errore
                        )
                    )
                    .positiveButton(
                        "OK",
                        function() {
                            return true;
                        }
                    )
                    .show();
            }

            return true;
        }
    }


    return {

        versione:
            "0.12-E",
        apriNuovaTransazione:
            function(contexto) {
                return esegui(
                    contexto,
                    "Nuova Transazione",
                    apriNuovaTransazione
                );
            },

        apriNuovaSpesaFissa:
            function(contexto) {
                return esegui(
                    contexto,
                    "Nuova Spesa Fissa",
                    apriNuovaSpesaFissa
                );
            },

        apriNuovaEntrataFissa:
            function(contexto) {
                return esegui(
                    contexto,
                    "Nuova Entrata Fissa",
                    apriNuovaEntrataFissa
                );
            },

        apriCheckSaldo:
            function(contexto) {
                return esegui(
                    contexto,
                    "Check Saldo",
                    apriCheckSaldo
                );
            },

        apriSelezioneVerificaEntrate:
            function(contexto) {
                return esegui(
                    contexto,
                    "Verifica Entrate",
                    apriSelezioneVerificaEntrate
                );
            }

    };

})();