// ============================================================
// FINANZE
// DASHBOARD V2
// CENTRO GESTIONE
// FILE ESTERNO
// VERSIONE 0.12-A
//
// BASE:
// Centro Gestione v0.11 VALIDATO
//
// SCOPO:
// Spostare il codice fuori dall'editor Memento
// SENZA modificare il comportamento.
//
// FUNZIONE PUBBLICA:
//
// renderCentroGestioneFinanze()
//
// ============================================================


function renderCentroGestioneFinanze() {


// ============================================================
// 1. LIBRERIE
// ============================================================

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


// ============================================================
// 2. COLORI
// ============================================================

var TESTO = "#222222";
var SECONDARIO = "#777777";
var BLU = "#3F51B5";
var VERDE = "#43A047";
var ROSSO = "#C62828";
var ARANCIO = "#EF6C00";
var LINEA = "#BDBDBD";


// ============================================================
// 3. UI BASE
// ============================================================

function testo(
    valore,
    dimensione,
    colore,
    stile
) {

    return ui()
        .text(
            String(
                valore
            )
        )
        .font({

            size:
                dimensione,

            color:
                colore,

            style:
                stile || "normal"

        });
}


function spazio(
    altezza
) {

    return ui()
        .text("")
        .height(
            altezza
        );
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
        .title(
            titolo
        )
        .text(
            contenuto
        )
        .positiveButton(
            "OK",
            function() {

                return true;
            }
        )
        .show();
}


// ============================================================
// 4. FUNZIONI BASE
// ============================================================

function arrotonda2(
    valore
) {

    return Math.round(
        Number(
            valore
        ) * 100
    ) / 100;
}


function numero(
    valore
) {

    var n =
        Number(
            valore
        );


    return isFinite(n)
        ? n
        : 0;
}


function dueCifre(
    valore
) {

    return valore < 10
        ? "0" + valore
        : String(valore);
}


function dataOraBreve(
    valore
) {

    if (!valore) {

        return "";
    }


    var data =
        new Date(
            valore
        );


    if (
        isNaN(
            data.getTime()
        )
    ) {

        return "";
    }


    return (
        dueCifre(
            data.getDate()
        ) +
        "/" +
        dueCifre(
            data.getMonth() + 1
        ) +
        "/" +
        data.getFullYear() +
        " " +
        dueCifre(
            data.getHours()
        ) +
        ":" +
        dueCifre(
            data.getMinutes()
        )
    );
}


function dataOraEditor(
    valore
) {

    var data =
        valore
            ? new Date(valore)
            : new Date();


    if (
        isNaN(
            data.getTime()
        )
    ) {

        data =
            new Date();
    }


    return (
        dueCifre(
            data.getDate()
        ) +
        "/" +
        dueCifre(
            data.getMonth() + 1
        ) +
        "/" +
        data.getFullYear() +
        " " +
        dueCifre(
            data.getHours()
        ) +
        ":" +
        dueCifre(
            data.getMinutes()
        )
    );
}


// ============================================================
// 5. IMPORTI
// ============================================================

function parseImporto(
    valore
) {

    var s =
        String(
            valore || ""
        )
        .trim()
        .replace(
            /€/g,
            ""
        )
        .replace(
            /\s/g,
            ""
        );


    if (
        s == ""
    ) {

        return null;
    }


    if (
        s.indexOf(",") >= 0 &&
        s.indexOf(".") >= 0
    ) {

        s =
            s.replace(
                /\./g,
                ""
            );

        s =
            s.replace(
                ",",
                "."
            );

    } else if (
        s.indexOf(",") >= 0
    ) {

        s =
            s.replace(
                ",",
                "."
            );
    }


    var n =
        Number(
            s
        );


    return isFinite(n)
        ? n
        : null;
}


function formattaEuro(
    valore
) {

    var n =
        numero(
            valore
        );


    var parti =
        Math.abs(n)
        .toFixed(2)
        .split(".");


    var intero =
        parti[0]
        .replace(
            /\B(?=(\d{3})+(?!\d))/g,
            "."
        );


    return (
        (
            n < 0
                ? "- "
                : ""
        ) +
        intero +
        "," +
        parti[1] +
        " €"
    );
}


// ============================================================
// 6. RELAZIONI
// ============================================================

function relazioni(
    valore
) {

    if (!valore) {

        return [];
    }


    if (
        typeof valore.length !=
        "undefined"
    ) {

        return valore;
    }


    return [
        valore
    ];
}


function contieneElemento(
    collegamenti,
    idElemento
) {

    var lista =
        relazioni(
            collegamenti
        );


    for (
        var i = 0;
        i < lista.length;
        i++
    ) {

        if (
            lista[i] &&
            lista[i].id ==
            idElemento
        ) {

            return true;
        }
    }


    return false;
}


function pulisciElementi(
    elenco
) {

    var risultato =
        [];


    if (!elenco) {

        return risultato;
    }


    for (
        var i = 0;
        i < elenco.length;
        i++
    ) {

        if (
            elenco[i] &&
            !elenco[i].deleted
        ) {

            risultato.push(
                elenco[i]
            );
        }
    }


    return risultato;
}


// ============================================================
// 7. ENTRATE VERIFICATE
// ============================================================

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


// ============================================================
// 8. ORDINE CRONOLOGICO
// ============================================================

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


    return moment(
        data
    )
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
        String(
            a.id || ""
        );

    var idb =
        String(
            b.id || ""
        );


    if (ida < idb) {

        return -1;
    }


    if (ida > idb) {

        return 1;
    }


    return 0;
}


// ============================================================
// 9. NOMI
// ============================================================

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


    return String(
        nome
    );
}


function etichettaConto(
    conto
) {

    if (!conto) {

        return "Conto";
    }


    var istituto =
        String(
            conto.field(
                "Istituto"
            ) || ""
        )
        .trim();


    var nome =
        String(
            conto.field(
                "Nome Conto"
            ) || ""
        )
        .trim();


    if (
        istituto != "" &&
        nome != ""
    ) {

        return (
            istituto +
            " - " +
            nome
        );
    }


    if (istituto != "") {

        return istituto;
    }


    if (nome != "") {

        return nome;
    }


    return "Conto";
}


// ============================================================
// 10. CONFIG GESTIONE
// ============================================================

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


// ============================================================
// 11. MOTORE
// ============================================================

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


// ============================================================
// 12. RICALCOLI
// ============================================================

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

    if (
        !motoreDisponibile
    ) {

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

    } catch (
        errore
    ) {

        return true;
    }
}


// ============================================================
// 13. CONTI ATTIVI
// ============================================================

function contiAttivi() {

    var risultato =
        [];


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


// ============================================================
// 14. NUOVA TRANSAZIONE
// ============================================================

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


    var opzioniConti =
        [];


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


// ============================================================
// 15. NUOVA SPESA FISSA
// ============================================================

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


    var opzioniConti =
        [];


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
                        .startOf("day")
                        .toDate()
                        .getTime();


                var nuovaSpesa =
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


// ============================================================
// 16. NUOVA ENTRATA FISSA
// ============================================================

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


    var opzioniConti =
        [];


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


// ============================================================
// 17. NUOVO SALVADANAIO - STEP 1
// ============================================================

function apriNuovoSalvadanaio() {

    if (!libSalvadanaio) {

        avviso(
            "Nuovo Salvadanaio",
            "La libreria [■] Salvadanaio non è accessibile."
        );

        return true;
    }


    var sceltaModalita =
        ui()
        .choiceBox(
            0,
            [
                "Fisso",
                "Importo",
                "Percentuale",
                "Manuale"
            ]
        );


    var vista =
        ui()
        .layout([

            testo(
                "MODALITÀ",
                11,
                BLU,
                "bold"
            ),

            sceltaModalita,

            spazio(7),

            testo(
                "Fisso",
                10,
                TESTO,
                "bold"
            ),

            testo(
                "Riserva iniziale senza regola automatica.",
                9,
                SECONDARIO
            ),

            spazio(5),

            testo(
                "Importo",
                10,
                TESTO,
                "bold"
            ),

            testo(
                "Accantona un importo fisso da un'Entrata Fissa.",
                9,
                SECONDARIO
            ),

            spazio(5),

            testo(
                "Percentuale",
                10,
                TESTO,
                "bold"
            ),

            testo(
                "Accantona una percentuale di un'Entrata Fissa.",
                9,
                SECONDARIO
            ),

            spazio(5),

            testo(
                "Manuale",
                10,
                TESTO,
                "bold"
            ),

            testo(
                "Nessuna regola automatica di accantonamento.",
                9,
                SECONDARIO
            )

        ])
        .width_match_parent();


    dialog()
        .title(
            "＋ Nuovo Salvadanaio"
        )
        .view(vista)
        .positiveButton(
            "CONTINUA",
            function() {

                var indice =
                    sceltaModalita.selected;


                var modalita =
                    [
                        "Fisso",
                        "Importo",
                        "Percentuale",
                        "Manuale"
                    ][indice];


                if (!modalita) {

                    return false;
                }


                apriDatiNuovoSalvadanaio(
                    modalita
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


// ============================================================
// 18. NUOVO SALVADANAIO - STEP 2
// ============================================================

function apriDatiNuovoSalvadanaio(
    modalita
) {

    var listaConti =
        contiAttivi();


    if (
        listaConti.length == 0
    ) {

        avviso(
            "Nuovo Salvadanaio",
            "Non ci sono conti attivi."
        );

        return;
    }


    var opzioniConti =
        [];


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


    var campoNome =
        ui()
        .edit("");


    var campoImportoIniziale =
        ui()
        .edit("0");


    var elementi =
        [

            testo(
                "MODALITÀ",
                10,
                BLU,
                "bold"
            ),

            testo(
                modalita,
                14,
                TESTO,
                "bold"
            ),

            spazio(8),

            testo(
                "CONTO",
                10,
                BLU,
                "bold"
            ),

            sceltaConto,

            spazio(6),

            testo(
                "NOME SALVADANAIO",
                10,
                BLU,
                "bold"
            ),

            campoNome,

            spazio(6),

            testo(
                "IMPORTO INIZIALE (€)",
                10,
                BLU,
                "bold"
            ),

            campoImportoIniziale

        ];


    var richiedeRegola =
        (
            modalita == "Importo" ||
            modalita == "Percentuale"
        );


    var campoValoreRegola =
        null;


    var sceltaEntrata =
        null;


    var riferimentiEntrate =
        [];


    if (
        richiedeRegola
    ) {

        campoValoreRegola =
            ui()
            .edit("");


        var entrate =
            libEntrateFisse
                ? libEntrateFisse.entries()
                : [];


        var opzioniEntrate =
            [];


        for (
            var e = 0;
            e < entrate.length;
            e++
        ) {

            var entrata =
                entrate[e];


            if (
                !entrata ||
                entrata.deleted
            ) {

                continue;
            }


            riferimentiEntrate.push(
                entrata
            );


            var nome =
                String(
                    entrata.field(
                        "Entrata"
                    ) || "Entrata"
                );


            var relConto =
                relazioni(
                    entrata.field(
                        "Conto"
                    )
                );


            if (
                relConto.length > 0
            ) {

                nome +=
                    " · " +
                    etichettaConto(
                        relConto[0]
                    );
            }


            opzioniEntrate.push(
                nome
            );
        }


        sceltaEntrata =
            ui()
            .choiceBox(
                0,
                opzioniEntrate
            );


        elementi.push(
            spazio(6)
        );


        elementi.push(
            testo(
                modalita == "Percentuale"
                    ? "PERCENTUALE DA ACCANTONARE (%)"
                    : "IMPORTO DA ACCANTONARE (€)",
                10,
                BLU,
                "bold"
            )
        );


        elementi.push(
            campoValoreRegola
        );


        elementi.push(
            spazio(6)
        );


        elementi.push(
            testo(
                "ENTRATA DI RIFERIMENTO",
                10,
                BLU,
                "bold"
            )
        );


        elementi.push(
            sceltaEntrata
        );
    }


    dialog()
        .title(
            "＋ Salvadanaio · " +
            modalita
        )
        .view(
            ui()
            .layout(
                elementi
            )
            .width_match_parent()
        )
        .positiveButton(
            "REGISTRA",
            function() {

                var indiceConto =
                    sceltaConto.selected;


                if (
                    indiceConto < 0 ||
                    indiceConto >=
                    listaConti.length
                ) {

                    return false;
                }


                var contoScelto =
                    listaConti[
                        indiceConto
                    ];


                var nome =
                    String(
                        campoNome.text || ""
                    )
                    .trim();


                if (!nome) {

                    avviso(
                        "Dato mancante",
                        "Inserisci il nome del Salvadanaio."
                    );

                    return false;
                }


                var importoIniziale =
                    parseImporto(
                        campoImportoIniziale.text
                    );


                if (
                    importoIniziale === null ||
                    importoIniziale < 0
                ) {

                    avviso(
                        "Importo non valido",
                        "L'Importo Iniziale deve essere maggiore o uguale a zero."
                    );

                    return false;
                }


                importoIniziale =
                    arrotonda2(
                        importoIniziale
                    );


                var valoreRegola =
                    0;


                var entrataRiferimento =
                    null;


                if (
                    richiedeRegola
                ) {

                    valoreRegola =
                        parseImporto(
                            campoValoreRegola.text
                        );


                    if (
                        valoreRegola === null ||
                        valoreRegola <= 0
                    ) {

                        avviso(
                            "Valore non valido",
                            modalita == "Percentuale"
                                ? "Inserisci una percentuale maggiore di zero."
                                : "Inserisci un importo maggiore di zero."
                        );

                        return false;
                    }


                    if (
                        modalita == "Percentuale" &&
                        valoreRegola > 100
                    ) {

                        avviso(
                            "Percentuale non valida",
                            "La percentuale deve essere compresa tra 0 e 100."
                        );

                        return false;
                    }


                    valoreRegola =
                        arrotonda2(
                            valoreRegola
                        );


                    if (
                        riferimentiEntrate.length == 0
                    ) {

                        avviso(
                            "Entrata di Riferimento",
                            "Non esistono Entrate Fisse disponibili."
                        );

                        return false;
                    }


                    var indiceEntrata =
                        sceltaEntrata.selected;


                    if (
                        indiceEntrata < 0 ||
                        indiceEntrata >=
                        riferimentiEntrate.length
                    ) {

                        return false;
                    }


                    entrataRiferimento =
                        riferimentiEntrate[
                            indiceEntrata
                        ];
                }


                var nuovoSalvadanaio =
                    libSalvadanaio.create({

                        "Nome Salvadanaio":
                            nome,

                        "Importo Iniziale":
                            importoIniziale,

                        "Modalità":
                            modalita,

                        "Valore Regola":
                            valoreRegola,

                        "Attivo":
                            true

                    });


                if (!nuovoSalvadanaio) {

                    return false;
                }


                nuovoSalvadanaio.link(
                    "Conto",
                    contoScelto
                );


                if (
                    entrataRiferimento
                ) {

                    nuovoSalvadanaio.link(
                        "Entrata di Riferimento",
                        entrataRiferimento
                    );
                }


                if (
                    typeof ricalcolaSalvadanai !=
                    "function"
                ) {

                    avviso(
                        "Motore non disponibile",
                        "ricalcolaSalvadanai() non è disponibile."
                    );

                    return false;
                }


                var risultato =
                    ricalcolaSalvadanai();


                if (
                    risultato !== true
                ) {

                    avviso(
                        "Errore",
                        "Ricalcolo Salvadanaio non completato."
                    );

                    return false;
                }


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
}


// ============================================================
// 19. NUOVO CHECK SALDO
// ============================================================

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


    var opzioni =
        [];


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


// ============================================================
// 20. CHECK DA VERIFICARE
// ============================================================

function listaCheckDaVerificare() {

    var risultato =
        [];


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


// ============================================================
// 21. SELETTORE VERIFICA ENTRATE
// ============================================================

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


    var opzioni =
        [];


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


// ============================================================
// 22. VERIFICA ENTRATE
// ============================================================

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
                            "DD/MM/YYYY HH:mm",
                            true
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


// ============================================================
// 23. GESTISCI CONTO - SELETTORE DASHBOARD
// ============================================================

function apriGestisciConto() {

    if (
        !libConti ||
        !libRegistro ||
        !libMovimentiSalvadanaio
    ) {

        avviso(
            "Gestisci conto",
            "Una o più librerie necessarie non sono accessibili."
        );

        return true;
    }


    var tutti =
        libConti.entries();


    var elenco =
        [];


    var etichette =
        [];


    for (
        var i = 0;
        i < tutti.length;
        i++
    ) {

        var conto =
            tutti[i];


        if (
            !conto ||
            conto.deleted
        ) {

            continue;
        }


        elenco.push(
            conto
        );


        etichette.push(
            etichettaConto(
                conto
            ) +
            (
                conto.field(
                    "Attivo"
                ) === true
                    ? " · ATTIVO"
                    : " · ARCHIVIATO"
            )
        );
    }


    if (
        elenco.length == 0
    ) {

        avviso(
            "Gestisci conto",
            "Non ci sono conti disponibili."
        );

        return true;
    }


    var scelta =
        ui()
        .choiceBox(
            0,
            etichette
        );


    dialog()
        .title(
            "⚙ Gestisci conto"
        )
        .view(
            ui()
            .layout([

                testo(
                    "SELEZIONA CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                scelta

            ])
        )
        .positiveButton(
            "APRI",
            function() {

                var indice =
                    scelta.selected;


                if (
                    indice < 0 ||
                    indice >=
                    elenco.length
                ) {

                    return false;
                }


                mostraGestioneConto(
                    elenco[
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


// ============================================================
// 24. GESTISCI CONTO - LOGICA v0.7 ADATTATA
// ============================================================

function mostraGestioneConto(
    conto
) {

    var nomeConto =
        String(
            conto.field(
                "Nome Conto"
            ) ||
            "Conto senza nome"
        );


    var tipoConto =
        String(
            conto.field(
                "Tipo di Conto"
            ) || ""
        );


    var istituto =
        String(
            conto.field(
                "Istituto"
            ) || ""
        );


    var GC_NERO = "#000000";
    var GC_TITOLO = "#263238";
    var GC_BLU = "#1565C0";
    var GC_TESTO = "#424242";
    var GC_GRIGIO = "#757575";
    var GC_VERDE = "#2E7D32";
    var GC_ROSSO = "#C62828";
    var GC_ARANCIO = "#EF6C00";


    function gcTxt(
        valore,
        size,
        colore,
        stile
    ) {

        return ui()
            .text(
                String(
                    valore
                )
            )
            .font({

                size:
                    size,

                color:
                    colore,

                style:
                    stile || "normal"

            });
    }


    function gcGap(
        size
    ) {

        return gcTxt(
            " ",
            size || 7,
            GC_NERO
        );
    }


    function gcLinea() {

        return gcTxt(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            11,
            GC_NERO,
            "bold"
        );
    }


    function gcTitolo(
        icona,
        valore
    ) {

        return gcTxt(
            icona +
            "  " +
            valore,
            16,
            GC_BLU,
            "bold"
        );
    }


    function gcRiga(
        valore,
        colore,
        size,
        stile
    ) {

        return ui()
            .layout([

                gcTxt(
                    "┃",
                    size || 15,
                    GC_NERO,
                    "bold"
                ),

                gcTxt(
                    "  " +
                    valore,
                    size || 15,
                    colore || GC_TESTO,
                    stile || "normal"
                )

            ])
            .horizontal();
    }


    function gcRigaVuota() {

        return gcRiga(
            " ",
            GC_TESTO,
            10
        );
    }


    function dipendenze(
        c
    ) {

        return {

            transazioni:
                pulisciElementi(
                    libTransazioni.linksTo(
                        c
                    )
                ),

            check:
                pulisciElementi(
                    libSaldo.linksTo(
                        c
                    )
                ),

            spese:
                pulisciElementi(
                    libSpeseFisse.linksTo(
                        c
                    )
                ),

            entrate:
                pulisciElementi(
                    libEntrateFisse.linksTo(
                        c
                    )
                ),

            salvadanai:
                pulisciElementi(
                    libSalvadanaio.linksTo(
                        c
                    )
                )

        };
    }


    function movimentiSalvadanai(
        elencoSalvadanai
    ) {

        var risultato =
            [];


        var visti =
            {};


        for (
            var s = 0;
            s < elencoSalvadanai.length;
            s++
        ) {

            var mov =
                pulisciElementi(
                    libMovimentiSalvadanaio.linksTo(
                        elencoSalvadanai[s]
                    )
                );


            for (
                var m = 0;
                m < mov.length;
                m++
            ) {

                var id =
                    String(
                        mov[m].id || ""
                    );


                if (
                    !visti[id]
                ) {

                    visti[id] =
                        true;


                    risultato.push(
                        mov[m]
                    );
                }
            }
        }


        return risultato;
    }


    function nomeRecord(
        record,
        tipo
    ) {

        var valore =
            "";


        if (
            tipo == "Conto"
        ) {

            valore =
                record.field(
                    "Nome Conto"
                );

        } else if (
            tipo == "Transazione"
        ) {

            valore =
                record.field(
                    "Transazione"
                );

        } else if (
            tipo == "Check Saldo"
        ) {

            valore =
                record.field(
                    "Disponibilità Formattata"
                ) ||
                "Check Saldo";

        } else if (
            tipo == "Spesa Fissa"
        ) {

            valore =
                record.field(
                    "Nome Spesa"
                );

        } else if (
            tipo == "Entrata Fissa"
        ) {

            valore =
                record.field(
                    "Entrata"
                );

        } else if (
            tipo == "Salvadanaio"
        ) {

            valore =
                record.field(
                    "Nome Salvadanaio"
                );

        } else if (
            tipo ==
            "Movimento Salvadanaio"
        ) {

            valore =
                record.field(
                    "Movimento"
                ) ||
                record.field(
                    "Tipo di Movimento"
                );
        }


        valore =
            String(
                valore || ""
            );


        if (
            valore == ""
        ) {

            valore =
                tipo +
                " #" +
                String(
                    record.id || ""
                );
        }


        return valore;
    }


    function generaIdOperazione() {

        var d =
            new Date();


        return (
            "DEL-" +
            d.getFullYear() +
            dueCifre(
                d.getMonth() + 1
            ) +
            dueCifre(
                d.getDate()
            ) +
            "-" +
            dueCifre(
                d.getHours()
            ) +
            dueCifre(
                d.getMinutes()
            ) +
            dueCifre(
                d.getSeconds()
            ) +
            "-" +
            String(
                conto.id || ""
            )
        );
    }


    function creaRigaRegistro(
        record,
        libreriaOrigine,
        tipoElemento,
        ordineRipristino,
        idOperazione,
        dataOperazione,
        nota
    ) {

        var rigaRegistro =
            libRegistro.create({

                "Operazione":
                    "Eliminazione " +
                    nomeConto,

                "ID Operazione":
                    idOperazione,

                "Data e Ora":
                    dataOperazione,

                "Tipo Operazione":
                    "ELIMINA CONTO",

                "Stato Operazione":
                    "IN CORSO",

                "Libreria Origine":
                    libreriaOrigine,

                "Tipo Elemento":
                    tipoElemento,

                "ID Elemento":
                    String(
                        record.id || ""
                    ),

                "Nome Elemento":
                    nomeRecord(
                        record,
                        tipoElemento
                    ),

                "ID Conto Padre":
                    String(
                        conto.id || ""
                    ),

                "Nome Conto Padre":
                    nomeConto,

                "Conto Attivo Prima":
                    (
                        tipoElemento ==
                        "Conto"
                            ? conto.field(
                                "Attivo"
                            ) === true
                            : false
                    ),

                "Ordine Ripristino":
                    ordineRipristino,

                "Note Tecniche":
                    String(
                        nota || ""
                    )

            });


        if (!rigaRegistro) {

            throw (
                "Impossibile creare Registro per " +
                tipoElemento
            );
        }


        return rigaRegistro;
    }


    function cestinaRecord(
        record,
        rigaRegistro
    ) {

        if (!record) {

            throw (
                "Record non valido."
            );
        }


        if (
            record.deleted
        ) {

            rigaRegistro.set(
                "Stato Operazione",
                "NEL CESTINO"
            );

            return;
        }


        record.trash();


        var libreriaOrigine =
            libByName(
                String(
                    rigaRegistro.field(
                        "Libreria Origine"
                    ) || ""
                )
            );


        var idElemento =
            String(
                rigaRegistro.field(
                    "ID Elemento"
                ) || ""
            );


        var verifica =
            libreriaOrigine
                ? libreriaOrigine.findById(
                    idElemento
                )
                : null;


        if (
            verifica &&
            verifica.deleted === true
        ) {

            rigaRegistro.set(
                "Stato Operazione",
                "NEL CESTINO"
            );

            return;
        }


        rigaRegistro.set(
            "Stato Operazione",
            "ERRORE"
        );


        throw (
            "Impossibile verificare il cestinamento di " +
            idElemento
        );
    }


    var dep =
        dipendenze(
            conto
        );


    var movimenti =
        movimentiSalvadanai(
            dep.salvadanai
        );


    var saldoAttuale =
        arrotonda2(
            conto.field(
                "Saldo Attuale"
            )
        );


    var saldoDisponibile =
        arrotonda2(
            conto.field(
                "Saldo Disponibile"
            )
        );


    var saldoIniziale =
        arrotonda2(
            conto.field(
                "Saldo Iniziale"
            )
        );


    var dataSaldoIniziale =
        conto.field(
            "Data Saldo Iniziale"
        );


    var fido =
        arrotonda2(
            conto.field(
                "Fido"
            )
        );


    var attivo =
        conto.field(
            "Attivo"
        );


    var totaleEntrate =
        0;


    var totaleUscite =
        0;


    for (
        var t = 0;
        t < dep.transazioni.length;
        t++
    ) {

        var tr =
            dep.transazioni[t];


        var valore =
            Math.abs(
                numero(
                    tr.field(
                        "Importo"
                    )
                )
            );


        if (
            tr.field(
                "Tipo"
            ) ==
            "Entrata"
        ) {

            totaleEntrate +=
                valore;
        }


        if (
            tr.field(
                "Tipo"
            ) ==
            "Uscita"
        ) {

            totaleUscite +=
                valore;
        }
    }


    var riserva =
        0;


    for (
        var rs = 0;
        rs < dep.salvadanai.length;
        rs++
    ) {

        riserva +=
            numero(
                dep.salvadanai[rs].field(
                    "Importo Effettivo"
                )
            );
    }


    riserva =
        arrotonda2(
            riserva
        );


    function archiviaConto() {

        if (
            attivo !== true
        ) {

            avviso(
                "📦 Conto già archiviato",
                nomeConto +
                " risulta già archiviato."
            );

            return;
        }


        var bloccoSaldo =
            Math.abs(
                saldoAttuale
            ) >= 0.01;


        var bloccoSpese =
            dep.spese.length > 0;


        var bloccoEntrate =
            dep.entrate.length > 0;


        var bloccoRiserva =
            Math.abs(
                riserva
            ) >= 0.01;


        if (
            bloccoSaldo ||
            bloccoSpese ||
            bloccoEntrate ||
            bloccoRiserva
        ) {

            var elementi =
                [

                    gcTxt(
                        "⛔ ARCHIVIAZIONE NON DISPONIBILE",
                        17,
                        GC_ROSSO,
                        "bold"
                    ),

                    gcGap(5),

                    gcTxt(
                        "🏦 " +
                        nomeConto,
                        18,
                        GC_TITOLO,
                        "bold"
                    ),

                    gcGap(7),

                    gcLinea()

                ];


            if (
                bloccoSaldo
            ) {

                elementi.push(
                    gcRiga(
                        "❌ Saldo da azzerare",
                        GC_ROSSO,
                        15,
                        "bold"
                    )
                );


                elementi.push(
                    gcRiga(
                        formattaEuro(
                            saldoAttuale
                        ),
                        GC_ROSSO,
                        14
                    )
                );
            }


            if (
                bloccoSpese
            ) {

                elementi.push(
                    gcRiga(
                        "❌ Spese Fisse da gestire: " +
                        dep.spese.length,
                        GC_ROSSO,
                        14
                    )
                );
            }


            if (
                bloccoEntrate
            ) {

                elementi.push(
                    gcRiga(
                        "❌ Entrate Fisse da gestire: " +
                        dep.entrate.length,
                        GC_ROSSO,
                        14
                    )
                );
            }


            if (
                bloccoRiserva
            ) {

                elementi.push(
                    gcRiga(
                        "❌ Riserva: " +
                        formattaEuro(
                            riserva
                        ),
                        GC_ARANCIO,
                        14
                    )
                );
            }


            elementi.push(
                gcLinea()
            );


            dialog()
                .title(
                    "Archivia conto"
                )
                .view(
                    ui()
                    .layout(
                        elementi
                    )
                )
                .positiveButton(
                    "OK",
                    function() {

                        return true;
                    }
                )
                .show();


            return;
        }


        dialog()
            .title(
                "📦 Conferma archiviazione"
            )
            .text(
                nomeConto +
                "\n\n" +
                "Saldo: " +
                formattaEuro(
                    saldoAttuale
                ) +
                "\n" +
                "Spese Fisse: 0\n" +
                "Entrate Fisse: 0\n" +
                "Riserva: " +
                formattaEuro(
                    riserva
                )
            )
            .negativeButton(
                "ANNULLA",
                function() {

                    return true;
                }
            )
            .positiveButton(
                "ARCHIVIA",
                function() {

                    try {

                        conto.set(
                            "Attivo",
                            false
                        );


                        ricalcolaSistemaCompleto();


                        avviso(
                            "Conto archiviato",
                            nomeConto
                        );

                    } catch (
                        err
                    ) {

                        avviso(
                            "Errore archiviazione",
                            String(
                                err
                            )
                        );
                    }


                    return true;
                }
            )
            .show();
    }


    function spostaRelazioni(
        elenco,
        destinazione
    ) {

        for (
            var i = 0;
            i < elenco.length;
            i++
        ) {

            elenco[i].set(
                "Conto",
                [
                    destinazione
                ]
            );
        }
    }


    function eseguiUnione(
        destinazione
    ) {

        try {

            var d =
                dipendenze(
                    destinazione
                );


            if (
                d.transazioni.length > 0 ||
                d.check.length > 0 ||
                d.spese.length > 0 ||
                d.entrate.length > 0 ||
                d.salvadanai.length > 0 ||
                Math.abs(
                    numero(
                        destinazione.field(
                            "Saldo Iniziale"
                        )
                    )
                ) >= 0.01 ||
                Math.abs(
                    numero(
                        destinazione.field(
                            "Saldo Attuale"
                        )
                    )
                ) >= 0.01
            ) {

                throw (
                    "La destinazione non è più vuota."
                );
            }


            destinazione.set(
                "Saldo Iniziale",
                saldoIniziale
            );


            if (
                dataSaldoIniziale
            ) {

                destinazione.set(
                    "Data Saldo Iniziale",
                    dataSaldoIniziale
                );
            }


            destinazione.set(
                "Fido",
                fido
            );


            spostaRelazioni(
                dep.transazioni,
                destinazione
            );


            spostaRelazioni(
                dep.check,
                destinazione
            );


            spostaRelazioni(
                dep.spese,
                destinazione
            );


            spostaRelazioni(
                dep.entrate,
                destinazione
            );


            spostaRelazioni(
                dep.salvadanai,
                destinazione
            );


            var residui =
                dipendenze(
                    conto
                );


            var totaleResidui =
                residui.transazioni.length +
                residui.check.length +
                residui.spese.length +
                residui.entrate.length +
                residui.salvadanai.length;


            if (
                totaleResidui > 0
            ) {

                throw (
                    "Migrazione incompleta. Relazioni residue: " +
                    totaleResidui
                );
            }


            conto.set(
                "Attivo",
                false
            );


            conto.set(
                "Saldo Iniziale",
                0
            );


            conto.set(
                "Fido",
                0
            );


            conto.set(
                "Saldo Attuale",
                0
            );


            conto.set(
                "Saldo Disponibile",
                0
            );


            ricalcolaSistemaCompleto();


            avviso(
                "✅ Unione completata",
                nomeConto +
                " → " +
                String(
                    destinazione.field(
                        "Nome Conto"
                    ) ||
                    "Destinazione"
                )
            );

        } catch (
            err
        ) {

            avviso(
                "⛔ Unione interrotta",
                String(
                    err
                ) +
                "\n\nNon eliminare nessun conto."
            );
        }
    }


    function mostraAnteprimaUnione(
        destinazione
    ) {

        var d =
            dipendenze(
                destinazione
            );


        var saldoInizialeDest =
            numero(
                destinazione.field(
                    "Saldo Iniziale"
                )
            );


        var saldoAttualeDest =
            numero(
                destinazione.field(
                    "Saldo Attuale"
                )
            );


        var vuota =
            (
                d.transazioni.length == 0 &&
                d.check.length == 0 &&
                d.spese.length == 0 &&
                d.entrate.length == 0 &&
                d.salvadanai.length == 0 &&
                Math.abs(
                    saldoInizialeDest
                ) < 0.01 &&
                Math.abs(
                    saldoAttualeDest
                ) < 0.01
            );


        var nomeDest =
            String(
                destinazione.field(
                    "Nome Conto"
                ) ||
                "Senza nome"
            );


        if (!vuota) {

            avviso(
                "⛔ Destinazione non vuota",
                nomeDest +
                "\n\nLa destinazione deve essere completamente vuota."
            );

            return;
        }


        dialog()
            .title(
                "🔁 Anteprima unione"
            )
            .text(
                nomeConto +
                "\n↓\n" +
                nomeDest +
                "\n\n" +
                "Saldo iniziale: " +
                formattaEuro(
                    saldoIniziale
                ) +
                "\n" +
                "Fido: " +
                formattaEuro(
                    fido
                ) +
                "\n" +
                "Transazioni: " +
                dep.transazioni.length +
                "\n" +
                "Check: " +
                dep.check.length +
                "\n" +
                "Spese Fisse: " +
                dep.spese.length +
                "\n" +
                "Entrate Fisse: " +
                dep.entrate.length +
                "\n" +
                "Salvadanai: " +
                dep.salvadanai.length
            )
            .negativeButton(
                "ANNULLA",
                function() {

                    return true;
                }
            )
            .positiveButton(
                "CONFERMA",
                function() {

                    eseguiUnione(
                        destinazione
                    );

                    return true;
                }
            )
            .show();
    }


    function unisciConto() {

        if (
            attivo !== true
        ) {

            avviso(
                "⛔ Unione non disponibile",
                "Il conto sorgente è già archiviato."
            );

            return;
        }


        var tutti =
            libConti.entries();


        var destinazioni =
            [];


        var etichette =
            [];


        for (
            var i = 0;
            i < tutti.length;
            i++
        ) {

            var c =
                tutti[i];


            if (
                !c ||
                c.deleted ||
                String(c.id) ==
                    String(conto.id) ||
                c.field(
                    "Attivo"
                ) !== true
            ) {

                continue;
            }


            destinazioni.push(
                c
            );


            etichette.push(
                etichettaConto(
                    c
                )
            );
        }


        if (
            destinazioni.length == 0
        ) {

            avviso(
                "Unisci conto",
                "Nessun altro conto attivo disponibile."
            );

            return;
        }


        var scelta =
            ui()
            .choiceBox(
                0,
                etichette
            );


        dialog()
            .title(
                "🔁 Seleziona destinazione"
            )
            .view(
                ui()
                .layout([

                    gcTxt(
                        "SORGENTE",
                        12,
                        GC_GRIGIO,
                        "bold"
                    ),

                    gcTxt(
                        nomeConto,
                        17,
                        GC_TITOLO,
                        "bold"
                    ),

                    gcGap(5),

                    gcTxt(
                        "DESTINAZIONE",
                        12,
                        GC_BLU,
                        "bold"
                    ),

                    scelta

                ])
            )
            .negativeButton(
                "ANNULLA",
                function() {

                    return true;
                }
            )
            .positiveButton(
                "ANTEPRIMA",
                function() {

                    var indice =
                        scelta.selected;


                    if (
                        indice < 0 ||
                        indice >=
                        destinazioni.length
                    ) {

                        return false;
                    }


                    mostraAnteprimaUnione(
                        destinazioni[
                            indice
                        ]
                    );


                    return true;
                }
            )
            .show();
    }


    function eliminaTuttoConto() {

        var totaleElementi =
            1 +
            dep.transazioni.length +
            dep.check.length +
            dep.spese.length +
            dep.entrate.length +
            dep.salvadanai.length +
            movimenti.length;


        dialog()
            .title(
                "🗑 Anteprima eliminazione"
            )
            .text(
                nomeConto +
                "\n\n" +
                "Conto: 1\n" +
                "Transazioni: " +
                dep.transazioni.length +
                "\n" +
                "Check Saldo: " +
                dep.check.length +
                "\n" +
                "Spese Fisse: " +
                dep.spese.length +
                "\n" +
                "Entrate Fisse: " +
                dep.entrate.length +
                "\n" +
                "Salvadanai: " +
                dep.salvadanai.length +
                "\n" +
                "Movimenti Salvadanaio: " +
                movimenti.length +
                "\n\nTotale: " +
                totaleElementi +
                "\n\n" +
                "Tutto verrà spostato nel Cestino nativo."
            )
            .negativeButton(
                "ANNULLA",
                function() {

                    return true;
                }
            )
            .positiveButton(
                "CONTINUA",
                function() {

                    confermaEliminazione();

                    return true;
                }
            )
            .show();
    }


    function confermaEliminazione() {

        dialog()
            .title(
                "⚠ Conferma cestinamento"
            )
            .text(
                "Tutti i dati di " +
                nomeConto +
                " verranno spostati nel Cestino.\n\n" +
                "Nessuna cancellazione definitiva."
            )
            .negativeButton(
                "ANNULLA",
                function() {

                    return true;
                }
            )
            .positiveButton(
                "SPOSTA NEL CESTINO",
                function() {

                    eseguiEliminazione();

                    return true;
                }
            )
            .show();
    }


    function eseguiEliminazione() {

        var idOperazione =
            generaIdOperazione();


        var dataOperazione =
            new Date()
                .getTime();


        var registriMovimenti =
            [];


        var registriSalvadanai =
            [];


        var registriEntrate =
            [];


        var registriSpese =
            [];


        var registriCheck =
            [];


        var registriTransazioni =
            [];


        var registroConto =
            null;


        try {

            for (
                var m = 0;
                m < movimenti.length;
                m++
            ) {

                registriMovimenti.push(
                    creaRigaRegistro(
                        movimenti[m],
                        "[■] Movimenti Salvadanaio",
                        "Movimento Salvadanaio",
                        70,
                        idOperazione,
                        dataOperazione,
                        "Eliminazione collegata al Conto " +
                        nomeConto
                    )
                );
            }


            for (
                var sv = 0;
                sv < dep.salvadanai.length;
                sv++
            ) {

                registriSalvadanai.push(
                    creaRigaRegistro(
                        dep.salvadanai[sv],
                        "[■] Salvadanaio",
                        "Salvadanaio",
                        60,
                        idOperazione,
                        dataOperazione,
                        ""
                    )
                );
            }


            for (
                var en = 0;
                en < dep.entrate.length;
                en++
            ) {

                registriEntrate.push(
                    creaRigaRegistro(
                        dep.entrate[en],
                        "[■] Entrate Fisse",
                        "Entrata Fissa",
                        50,
                        idOperazione,
                        dataOperazione,
                        ""
                    )
                );
            }


            for (
                var sp = 0;
                sp < dep.spese.length;
                sp++
            ) {

                registriSpese.push(
                    creaRigaRegistro(
                        dep.spese[sp],
                        "[■] Spese Fisse",
                        "Spesa Fissa",
                        40,
                        idOperazione,
                        dataOperazione,
                        ""
                    )
                );
            }


            for (
                var ck = 0;
                ck < dep.check.length;
                ck++
            ) {

                registriCheck.push(
                    creaRigaRegistro(
                        dep.check[ck],
                        "[■] Saldo",
                        "Check Saldo",
                        30,
                        idOperazione,
                        dataOperazione,
                        ""
                    )
                );
            }


            for (
                var tr = 0;
                tr < dep.transazioni.length;
                tr++
            ) {

                registriTransazioni.push(
                    creaRigaRegistro(
                        dep.transazioni[tr],
                        "[■] Transazioni",
                        "Transazione",
                        20,
                        idOperazione,
                        dataOperazione,
                        ""
                    )
                );
            }


            registroConto =
                creaRigaRegistro(
                    conto,
                    "[■] Conti",
                    "Conto",
                    10,
                    idOperazione,
                    dataOperazione,
                    ""
                );


            for (
                var cm = 0;
                cm < movimenti.length;
                cm++
            ) {

                cestinaRecord(
                    movimenti[cm],
                    registriMovimenti[cm]
                );
            }


            for (
                var cs = 0;
                cs < dep.salvadanai.length;
                cs++
            ) {

                cestinaRecord(
                    dep.salvadanai[cs],
                    registriSalvadanai[cs]
                );
            }


            for (
                var ce = 0;
                ce < dep.entrate.length;
                ce++
            ) {

                cestinaRecord(
                    dep.entrate[ce],
                    registriEntrate[ce]
                );
            }


            for (
                var csp = 0;
                csp < dep.spese.length;
                csp++
            ) {

                cestinaRecord(
                    dep.spese[csp],
                    registriSpese[csp]
                );
            }


            for (
                var cc = 0;
                cc < dep.check.length;
                cc++
            ) {

                cestinaRecord(
                    dep.check[cc],
                    registriCheck[cc]
                );
            }


            for (
                var ct = 0;
                ct < dep.transazioni.length;
                ct++
            ) {

                cestinaRecord(
                    dep.transazioni[ct],
                    registriTransazioni[ct]
                );
            }


            cestinaRecord(
                conto,
                registroConto
            );


            ricalcolaSistemaCompleto();


            avviso(
                "♻ Eliminazione completata",
                "Operazione:\n" +
                idOperazione +
                "\n\n" +
                "Tutti gli elementi sono recuperabili dal Cestino."
            );

        } catch (
            errore
        ) {

            avviso(
                "⛔ Eliminazione interrotta",
                "Operazione:\n" +
                idOperazione +
                "\n\n" +
                String(
                    errore
                ) +
                "\n\n" +
                "NON modificare il Registro Eliminazioni."
            );
        }
    }


    var header =
        ui()
        .layout([

            gcTxt(
                "🏦 " +
                nomeConto,
                22,
                GC_TITOLO,
                "bold"
            ),

            gcTxt(
                (
                    tipoConto ||
                    "Conto"
                ) +
                (
                    istituto
                        ? " • " +
                          istituto
                        : ""
                ),
                14,
                GC_GRIGIO
            ),

            gcTxt(
                attivo === true
                    ? "● ATTIVO"
                    : "● ARCHIVIATO",
                14,
                attivo === true
                    ? GC_VERDE
                    : GC_GRIGIO,
                "bold"
            )

        ]);


    var bloccoConto =
        ui()
        .layout([

            gcTitolo(
                "💰",
                "DATI CONTO"
            ),

            gcLinea(),

            gcRiga(
                "Saldo attuale  ➜  " +
                formattaEuro(
                    saldoAttuale
                )
            ),

            gcRiga(
                "Disponibile  ➜  " +
                formattaEuro(
                    saldoDisponibile
                )
            ),

            gcRiga(
                "Fido  ➜  " +
                formattaEuro(
                    fido
                )
            ),

            gcLinea()

        ]);


    var bloccoCollegati =
        ui()
        .layout([

            gcTitolo(
                "📊",
                "DATI COLLEGATI"
            ),

            gcLinea(),

            gcRiga(
                "Transazioni  ➜  " +
                dep.transazioni.length
            ),

            gcRiga(
                "↳ Entrate  " +
                formattaEuro(
                    totaleEntrate
                ),
                GC_VERDE,
                14
            ),

            gcRiga(
                "↳ Uscite  " +
                formattaEuro(
                    totaleUscite
                ),
                GC_ROSSO,
                14
            ),

            gcRiga(
                "Check Saldo  ➜  " +
                dep.check.length
            ),

            gcRiga(
                "Spese Fisse  ➜  " +
                dep.spese.length
            ),

            gcRiga(
                "Entrate Fisse  ➜  " +
                dep.entrate.length
            ),

            gcRiga(
                "Salvadanai  ➜  " +
                dep.salvadanai.length
            ),

            gcRiga(
                "↳ Riserva  " +
                formattaEuro(
                    riserva
                ),
                GC_ARANCIO,
                14
            ),

            gcRiga(
                "Movimenti salvadanaio  ➜  " +
                movimenti.length
            ),

            gcLinea()

        ]);


    dialog()
        .title(
            "Gestisci conto"
        )
        .view(
            ui()
            .layout([

                header,

                gcGap(9),

                bloccoConto,

                gcGap(12),

                bloccoCollegati,

                gcGap(12),

                gcTxt(
                    "⚙ GESTIONE",
                    16,
                    GC_BLU,
                    "bold"
                ),

                gcLinea(),

                gcRiga(
                    "📦 ARCHIVIA",
                    GC_VERDE,
                    15,
                    "bold"
                ),

                gcRiga(
                    "🔁 UNISCI",
                    GC_BLU,
                    15,
                    "bold"
                ),

                gcRiga(
                    "🗑 ELIMINA TUTTO",
                    GC_ROSSO,
                    15,
                    "bold"
                ),

                gcLinea()

            ])
        )
        .positiveButton(
            "📦 ARCHIVIA",
            function() {

                archiviaConto();

                return true;
            }
        )
        .neutralButton(
            "🔁 UNISCI",
            function() {

                unisciConto();

                return true;
            }
        )
        .negativeButton(
            "🗑 ELIMINA",
            function() {

                eliminaTuttoConto();

                return true;
            }
        )
        .show();
}


// ============================================================
// 25. RENDER DASHBOARD
// ============================================================

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

} else {


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


// ============================================================
// FINE renderCentroGestioneFinanze()
// ============================================================

}