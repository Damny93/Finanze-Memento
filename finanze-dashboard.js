// ============================================================
// FINANZE
// DASHBOARD V2
// CENTRO GESTIONE
// FILE ESTERNO
// VERSIONE 0.12-D
//
// BASE:
// v0.12-C VALIDATA
//
// MODIFICA ATOMICA:
// Nuovo Salvadanaio delegato a finanze-salvadanaio.js.
//
// DIPENDENZE:
// - moment.min.js
// - finanze-motore.js
// - finanze-core.js
// - finanze-conti.js
// - finanze-salvadanaio.js
//
// ============================================================

function renderCentroGestioneFinanze() {

    if (
        typeof FinanzeCore ==
        "undefined"
    ) {
        return ui()
            .text(
                "⛔ ERRORE\n\n" +
                "finanze-core.js non è disponibile."
            );
    }

    var arrotonda2 =
        FinanzeCore.arrotonda2;

    var numero =
        FinanzeCore.numero;

    var dueCifre =
        FinanzeCore.dueCifre;

    var dataOraBreve =
        FinanzeCore.dataOraBreve;

    var dataOraEditor =
        FinanzeCore.dataOraEditor;

    var parseImporto =
        FinanzeCore.parseImporto;

    var formattaEuro =
        FinanzeCore.formattaEuro;

    var relazioni =
        FinanzeCore.relazioni;

    var contieneElemento =
        FinanzeCore.contieneElemento;

    var pulisciElementi =
        FinanzeCore.pulisciElementi;

    var etichettaConto =
        FinanzeCore.etichettaConto;


    // ========================================================
    // 1. LIBRERIE
    // ========================================================

    var libDashboard =
        libByName("[■] Dashboard Finanze");

    var libConti =
        libByName("[■] Conti");

    var libSaldo =
        libByName("[■] Saldo");

    var libTransazioni =
        libByName("[■] Transazioni");

    var libSpeseFisse =
        libByName("[■] Spese Fisse");

    var libEntrateFisse =
        libByName("[■] Entrate Fisse");

    var libSalvadanaio =
        libByName("[■] Salvadanaio");

    var libMovimentiSalvadanaio =
        libByName("[■] Movimenti Salvadanaio");

    var libRegistro =
        libByName("[■] Registro Eliminazioni");

    var recordsDashboard =
        libDashboard
            ? libDashboard.entries()
            : [];
    var conti =
        libConti
            ? libConti.entries()
            : [];

    var checks =
        libSaldo
            ? libSaldo.entries()
            : [];


    // ========================================================
    // 2. COLORI
    // ========================================================

    var TESTO = "#222222";
    var SECONDARIO = "#777777";
    var BLU = "#3F51B5";
    var VERDE = "#43A047";
    var ROSSO = "#C62828";
    var ARANCIO = "#EF6C00";
    var LINEA = "#BDBDBD";


    // ========================================================
    // 3. UI BASE
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

    function separatore() {
        return testo(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            7,
            LINEA
        );
    }

    function avviso(
        titolo,
        contenuto
    ) {
        dialog()
            .title(titolo)
            .text(contenuto)
            .positiveButton(
                "OK",
                function() {
                    return true;
                }
            )
            .show();
    }


    // ========================================================
    // 4. ENTRATE VERIFICATE
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
    // 5. ORDINE CRONOLOGICO
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
    // 6. NOME MOVIMENTO
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
    // 7. CONFIG GESTIONE
    // ========================================================

    var config =
        null;

    for (
        var i = 0;
        i < recordsDashboard.length;
        i++
    ) {
        if (
            String(
                recordsDashboard[i].field(
                    "Codice KPI"
                ) || ""
            ) ==
            "GESTIONE_V2"
        ) {
            config =
                recordsDashboard[i];

            break;
        }
    }


    // ========================================================
    // 8. MOTORE
    // ========================================================

    var haRicalcoloSalvadanai =
        (
            typeof ricalcolaSalvadanai ==
            "function"
        );

    var haRicalcoloFinanze =
        (
            typeof ricalcolaFinanze ==
            "function"
        );

    var motoreDisponibile =
        (
            haRicalcoloSalvadanai ||
            haRicalcoloFinanze
        );

    var versioneMotore =
        "non disponibile";

    if (
        motoreDisponibile &&
        typeof versioneMotoreFinanze ==
        "function"
    ) {
        versioneMotore =
            String(
                versioneMotoreFinanze()
            );
    }


    // ========================================================
    // 9. RICALCOLI
    // ========================================================

    function ricalcolaMotore() {
        ricalcolaFinanze(
            libSaldo,
            libTransazioni,
            libConti,
            libDashboard,
            libSpeseFisse,
            libSalvadanaio
        );
    }

    function ricalcolaSistemaCompleto() {
        if (
            typeof ricalcolaSalvadanai ==
            "function"
        ) {
            ricalcolaSalvadanai();
            return;
        }

        if (
            typeof ricalcolaFinanze ==
            "function"
        ) {
            ricalcolaMotore();
            return;
        }

        throw (
            "Motore FINANZE non disponibile."
        );
    }

    function eseguiRicalcolo() {
        if (!motoreDisponibile) {
            return true;
        }

        try {
            ricalcolaSistemaCompleto();

            config.set(
                "Ultimo Ricalcolo",
                new Date()
                    .getTime()
            );

            return true;

        } catch (errore) {
            return true;
        }
    }


    // ========================================================
    // 10. CONTI ATTIVI
    // ========================================================

    function contiAttivi() {
        var risultato = [];

        for (
            var i = 0;
            i < conti.length;
            i++
        ) {
            if (
                conti[i].field(
                    "Attivo"
                ) === false
            ) {
                continue;
            }

            risultato.push(
                conti[i]
            );
        }

        return risultato;
    }


    // ========================================================
    // 11. NUOVA TRANSAZIONE
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
    // 12. NUOVA SPESA FISSA
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
    // 13. NUOVA ENTRATA FISSA
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
    // 14. NUOVO SALVADANAIO - DELEGA MODULO ESTERNO
    // ========================================================

    function apriNuovoSalvadanaio() {

        if (
            typeof FinanzeSalvadanaio ==
            "undefined" ||
            typeof FinanzeSalvadanaio.apriNuovoSalvadanaio !=
            "function"
        ) {
            avviso(
                "Nuovo Salvadanaio",
                "finanze-salvadanaio.js non è disponibile."
            );

            return true;
        }


        return FinanzeSalvadanaio.apriNuovoSalvadanaio({

            libEntrateFisse:
                libEntrateFisse,

            libSalvadanaio:
                libSalvadanaio,

            contiAttivi:
                contiAttivi,

            avviso:
                avviso

        });
    }


    // ========================================================
    // 16. NUOVO CHECK SALDO
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
    // 17. CHECK DA VERIFICARE
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
    // 18. SELETTORE VERIFICA ENTRATE
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
    // 19. VERIFICA ENTRATE
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
    // 20. GESTISCI CONTO - DELEGA MODULO ESTERNO
    // ========================================================

    function apriGestisciConto() {

        if (
            typeof FinanzeConti ==
            "undefined" ||
            typeof FinanzeConti.apriGestisciConto !=
            "function"
        ) {
            avviso(
                "Gestisci conto",
                "finanze-conti.js non è disponibile."
            );

            return true;
        }


        return FinanzeConti.apriGestisciConto({

            libConti:
                libConti,
            libSaldo:
                libSaldo,

            libTransazioni:
                libTransazioni,

            libSpeseFisse:
                libSpeseFisse,

            libEntrateFisse:
                libEntrateFisse,

            libSalvadanaio:
                libSalvadanaio,

            libMovimentiSalvadanaio:
                libMovimentiSalvadanaio,

            libRegistro:
                libRegistro,
            avviso:
                avviso,

            ricalcolaSistemaCompleto:
                ricalcolaSistemaCompleto

        });
    }


    // 22. RENDER DASHBOARD
    // ========================================================

    if (!config) {
        return ui()
            .layout([

                testo(
                    "⚠ CENTRO GESTIONE",
                    16,
                    ROSSO,
                    "bold"
                ),

                spazio(4),

                testo(
                    "Record GESTIONE_V2 non trovato.",
                    11,
                    SECONDARIO
                )

            ])
            .width_match_parent();
    }


    var aperto =
        config.field(
            "Pannello Gestione Aperto"
        ) !== false;
    var pulsanteStato =
        ui()
        .button(
            aperto
                ? "▲ RIDUCI"
                : "▼ APRI"
        );

    pulsanteStato.action(
        function() {

            config.set(
                "Pannello Gestione Aperto",
                !aperto
            );

            return true;
        }
    );

    var elementi =
        [];

    elementi.push(
        ui()
            .layout([

                testo(
                    "GESTIONE",
                    18,
                    TESTO,
                    "bold"
                )
                .weight(1),

                pulsanteStato
                    .width_wrap_content(),

                ui()
                    .text("")
                    .width(48)
            ])
            .horizontal()
            .width_match_parent()
    );

    if (!aperto) {
        elementi.push(
            testo(
                "Centro operativo Finanze",
                10,
                SECONDARIO
            )
        );

    } else {

        elementi.push(
            spazio(3)
        );

        elementi.push(
            testo(
                "Azioni rapide e strumenti di gestione",
                10,
                SECONDARIO
            )
        );

        elementi.push(
            spazio(5)
        );

        elementi.push(
            separatore()
        );


        // ====================================================
        // CONTI
        // ====================================================

        elementi.push(
            spazio(4)
        );

        elementi.push(
            testo(
                "CONTI",
                11,
                BLU,
                "bold"
            )
        );

        var btnNuovoConto =
            ui()
            .button(
                "＋ NUOVO CONTO"
            );

        btnNuovoConto.action(
            function() {
                return false;
            }
        );

        var btnGestisciConto =
            ui()
            .button(
                "⚙ GESTISCI"
            );

        btnGestisciConto.action(
            function() {
                return apriGestisciConto();
            }
        );

        elementi.push(
            ui()
                .layout([

                    btnNuovoConto
                        .weight(1),

                    btnGestisciConto
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );


        // ====================================================
        // MOVIMENTI
        // ====================================================

        elementi.push(
            spazio(5)
        );

        elementi.push(
            testo(
                "MOVIMENTI",
                11,
                BLU,
                "bold"
            )
        );

        var btnTransazione =
            ui()
            .button(
                "＋ TRANSAZIONE"
            );

        btnTransazione.action(
            function() {
                return apriNuovaTransazione();
            }
        );

        var btnCheck =
            ui()
            .button(
                "✓ CHECK SALDO"
            );

        btnCheck.action(
            function() {
                return apriCheckSaldo();
            }
        );

        elementi.push(
            ui()
                .layout([

                    btnTransazione
                        .weight(1),

                    btnCheck
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );

        var btnVerificaEntrate =
            ui()
            .button(
                "✓ VERIFICA ENTRATE"
            );

        btnVerificaEntrate.action(
            function() {
                return apriSelezioneVerificaEntrate();
            }
        );

        elementi.push(
            ui()
                .layout([

                    btnVerificaEntrate
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );


        // ====================================================
        // RICORRENTI
        // ====================================================

        elementi.push(
            spazio(5)
        );

        elementi.push(
            testo(
                "RICORRENTI",
                11,
                BLU,
                "bold"
            )
        );

        var btnSpesa =
            ui()
            .button(
                "↓ SPESA FISSA"
            );

        btnSpesa.action(
            function() {
                return apriNuovaSpesaFissa();
            }
        );

        var btnEntrata =
            ui()
            .button(
                "↑ ENTRATA FISSA"
            );
        btnEntrata.action(
            function() {
                return apriNuovaEntrataFissa();
            }
        );

        elementi.push(
            ui()
                .layout([

                    btnSpesa
                        .weight(1),

                    btnEntrata
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );

        // ====================================================
        // SALVADANAIO
        // ====================================================

        elementi.push(
            spazio(5)
        );

        elementi.push(
            testo(
                "SALVADANAIO",
                11,
                BLU,
                "bold"
            )
        );

        var btnNuovoSalvadanaio =
            ui()
            .button(
                "＋ NUOVO"
            );

        btnNuovoSalvadanaio.action(
            function() {
                return apriNuovoSalvadanaio();
            }
        );

        var btnGestisciSalvadanaio =
            ui()
            .button(
                "⚙ GESTISCI"
            );

        btnGestisciSalvadanaio.action(
            function() {
                return false;
            }
        );
        elementi.push(
            ui()
                .layout([

                    btnNuovoSalvadanaio
                        .weight(1),

                    btnGestisciSalvadanaio
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );


        // ====================================================
        // SISTEMA
        // ====================================================

        elementi.push(
            spazio(5)
        );

        elementi.push(
            separatore()
        );

        elementi.push(
            spazio(4)
        );

        elementi.push(
            testo(
                "SISTEMA",
                11,
                ROSSO,
                "bold"
            )
        );

        var btnRicalcola =
            ui()
            .button(
                "♻ RICALCOLA"
            );

        btnRicalcola.action(
            function() {
                return eseguiRicalcolo();
            }
        );

        var btnCestino =
            ui()
            .button(
                "🗑 CESTINO"
            );

        btnCestino.action(
            function() {
                return false;
            }
        );

        elementi.push(
            ui()
                .layout([

                    btnRicalcola
                        .weight(1),

                    btnCestino
                        .weight(1)

                ])
                .horizontal()
                .width_match_parent()
        );

        elementi.push(
            spazio(5)
        );
        elementi.push(
            testo(
                motoreDisponibile
                    ? (
                        "● Motore " +
                        versioneMotore
                    )
                    : "● Motore non disponibile",
                10,
                motoreDisponibile
                    ? VERDE
                    : ROSSO,
                "bold"
            )
        );

        var ultimo =
            dataOraBreve(
                config.field(
                    "Ultimo Ricalcolo"
                )
            );

        elementi.push(
            testo(
                ultimo != ""
                    ? (
                        "Ultimo ricalcolo: " +
                        ultimo
                    )
                    : "Nessun ricalcolo manuale",
                9,
                SECONDARIO
            )
        );
    }


    return ui()
        .layout(
            elementi
        )
        .width_match_parent();
}