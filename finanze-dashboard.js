// ============================================================
// FINANZE
// DASHBOARD V2
// CENTRO GESTIONE
// FILE ESTERNO
// VERSIONE 0.13-A
//
// BASE:
// v0.12-E VALIDATA
//
// MODIFICA ATOMICA v0.13-A:
// attivato ＋ NUOVO CONTO tramite finanze-conti.js.
//
// DIPENDENZE:
// - moment.min.js
// - finanze-motore.js
// - finanze-core.js
// - finanze-conti.js
// - finanze-salvadanaio.js
// - finanze-azioni.js
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
    // ========================================================
    // 11. AZIONI OPERATIVE - DELEGA MODULO ESTERNO
    // ========================================================

    function contestoAzioni() {

        return {

            libSaldo:
                libSaldo,

            libTransazioni:
                libTransazioni,

            libSpeseFisse:
                libSpeseFisse,

            libEntrateFisse:
                libEntrateFisse,

            checks:
                checks,

            contiAttivi:
                contiAttivi,

            avviso:
                avviso,

            ricalcolaMotore:
                ricalcolaMotore

        };
    }


    function moduloAzioniDisponibile() {

        if (
            typeof FinanzeAzioni ==
            "undefined"
        ) {
            avviso(
                "Azioni Finanze",
                "finanze-azioni.js non è disponibile."
            );

            return false;
        }

        return true;
    }


    function apriNuovaTransazione() {

        if (
            !moduloAzioniDisponibile() ||
            typeof FinanzeAzioni.apriNuovaTransazione !=
            "function"
        ) {
            return true;
        }

        return FinanzeAzioni.apriNuovaTransazione(
            contestoAzioni()
        );
    }


    function apriNuovaSpesaFissa() {

        if (
            !moduloAzioniDisponibile() ||
            typeof FinanzeAzioni.apriNuovaSpesaFissa !=
            "function"
        ) {
            return true;
        }

        return FinanzeAzioni.apriNuovaSpesaFissa(
            contestoAzioni()
        );
    }


    function apriNuovaEntrataFissa() {

        if (
            !moduloAzioniDisponibile() ||
            typeof FinanzeAzioni.apriNuovaEntrataFissa !=
            "function"
        ) {
            return true;
        }

        return FinanzeAzioni.apriNuovaEntrataFissa(
            contestoAzioni()
        );
    }


    function apriCheckSaldo() {

        if (
            !moduloAzioniDisponibile() ||
            typeof FinanzeAzioni.apriCheckSaldo !=
            "function"
        ) {
            return true;
        }

        return FinanzeAzioni.apriCheckSaldo(
            contestoAzioni()
        );
    }


    function apriSelezioneVerificaEntrate() {

        if (
            !moduloAzioniDisponibile() ||
            typeof FinanzeAzioni.apriSelezioneVerificaEntrate !=
            "function"
        ) {
            return true;
        }

        return FinanzeAzioni.apriSelezioneVerificaEntrate(
            contestoAzioni()
        );
    }


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
    // 19. NUOVO CONTO - DELEGA MODULO ESTERNO
    // ========================================================

    function apriNuovoConto() {

        if (
            typeof FinanzeConti ==
            "undefined" ||
            typeof FinanzeConti.apriNuovoConto !=
            "function"
        ) {
            avviso(
                "Nuovo conto",
                "finanze-conti.js v0.13-A non è disponibile."
            );
            return true;
        }

        return FinanzeConti.apriNuovoConto({

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
                return apriNuovoConto();
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