// ============================================================
// FINANZE
// MOTORE CENTRALE - RICALCOLO FINANZE
// VERSIONE: 0.7.0 PRO
// ============================================================
//
// LIBRERIA:
// [■] Transazioni
//
// TIPO:
// Condiviso
//
// FUNZIONE PUBBLICA:
// ricalcolaFinanze()
//
// BASE:
// MOTORE TRANSAZIONI v0.3 TEST - VERIFICATO
//
// IMPORTANTE:
// Questo script NON contiene logica di trigger.
// Creazione / Modifica / Eliminazione decidono quando
// richiamare ricalcolaFinanze().
//
// LOGICA 0.7:
// - Primo Check = baseline automatica.
// - Check successivi = VERIFICA ENTRATE.
// - Nessuna "Altra Spesa" viene creata finché
//   "Entrate Verificate" non è true.
// - Differenza positiva riapre il Check.
//
// ============================================================

function ricalcolaFinanze(
    libreriaSaldo,
    libreriaTransazioni,
    libreriaConti,
    libreriaDashboard,
    libreriaSpeseFisseDashboard,
    libreriaSalvadanaioDashboard
) {


    // ========================================================
    // 1. LIBRERIE
    // ========================================================
    //
    // Tutte le librerie usate dal motore vengono ricevute
    // direttamente dallo script chiamante Memento.
    //
    // Il file JavaScript esterno NON risolve librerie da solo.
    // Questo evita problemi di contesto su Memento Desktop.
    // ========================================================


    // ========================================================
    // 2. CONTROLLO LIBRERIE
    // ========================================================

    if (
        !libreriaSaldo ||
        !libreriaTransazioni ||
        !libreriaConti ||
        !libreriaDashboard ||
        !libreriaSpeseFisseDashboard ||
        !libreriaSalvadanaioDashboard
    ) {

        message(
            "ERRORE v0.7.0: una o più librerie FINANZE non sono accessibili."
        );

        return;
    }


    // ========================================================
    // 3. DATI GLOBALI
    // ========================================================

    var tuttiCheck =
        libreriaSaldo.entries();

    var tutteTransazioni =
        libreriaTransazioni.entries();

    var tuttiConti =
        libreriaConti.entries();


    // Le nuove riconciliazioni vengono aggiunte anche
    // a tutteTransazioni, perché Memento potrebbe non
    // restituirle immediatamente con entries().

    var riconciliazioniCreate =
        [];


    // ========================================================
    // 4. FUNZIONI COMUNI
    // ========================================================

    function contieneConto(
        collegamenti,
        idConto
    ) {

        if (
            !collegamenti ||
            collegamenti.length == 0
        ) {

            return false;
        }


        for (
            var i = 0;
            i < collegamenti.length;
            i++
        ) {

            if (
                collegamenti[i].id ==
                idConto
            ) {

                return true;
            }
        }


        return false;
    }


    function tempoVoce(
        voce
    ) {

        var data =
            voce.field(
                "Data e Ora"
            );


        if (
            !data
        ) {

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

        var tempoA =
            tempoVoce(a);

        var tempoB =
            tempoVoce(b);


        if (
            tempoA < tempoB
        ) {

            return -1;
        }


        if (
            tempoA > tempoB
        ) {

            return 1;
        }


        var idA =
            String(
                a.id || ""
            );

        var idB =
            String(
                b.id || ""
            );


        if (
            idA < idB
        ) {

            return -1;
        }


        if (
            idA > idB
        ) {

            return 1;
        }


        return 0;
    }


    function arrotonda2(
        valore
    ) {

        return Math.round(
            Number(valore) * 100
        ) / 100;
    }


    function formattaSaldoProgressivo(
        valore
    ) {

        var numero =
            Number(
                valore
            );


        if (
            !isFinite(numero)
        ) {

            return "";
        }


        var parti =
            Math.abs(numero)
            .toFixed(2)
            .split(".");


        var intero =
            parti[0].replace(
                /\B(?=(\d{3})+(?!\d))/g,
                "."
            );


        var testo =
            intero +
            "," +
            parti[1] +
            " €";


        if (
            numero < 0
        ) {

            return (
                "[ \u26C3 - " +
                testo +
                " ]"
            );
        }


        return (
            "[ \u26C3 " +
            testo +
            " ]"
        );
    }


    // ========================================================
    // 5. CICLO DI RICOSTRUZIONE DI TUTTI I CONTI
    // ========================================================

    for (
        var indiceConto = 0;
        indiceConto < tuttiConti.length;
        indiceConto++
    ) {

        var conto =
            tuttiConti[
                indiceConto
            ];


        var idConto =
            conto.id;


        if (
            idConto == null
        ) {

            continue;
        }


        var collegamentoConto =
            conto;


        // ====================================================
        // 5A. CHECK DEL CONTO
        // ====================================================

        var checkContoOrdinati =
            [];


        for (
            var cc = 0;
            cc < tuttiCheck.length;
            cc++
        ) {

            var checkConto =
                tuttiCheck[cc];


            var collegamentiCheck =
                checkConto.field(
                    "Conto"
                );


            if (
                !contieneConto(
                    collegamentiCheck,
                    idConto
                )
            ) {

                continue;
            }


            if (
                !checkConto.field(
                    "Data e Ora"
                )
            ) {

                continue;
            }


            checkContoOrdinati.push(
                checkConto
            );
        }


        checkContoOrdinati.sort(
            ordinaCronologicamente
        );


        // ====================================================
        // 5B. PRIMO CHECK
        // ====================================================

        if (
            checkContoOrdinati.length > 0
        ) {

            var primoCheck =
                checkContoOrdinati[0];


            // Il primo Check del conto è la baseline.
            // Non esiste un intervallo precedente da verificare.
            primoCheck.set(
                "Entrate Verificate",
                true
            );


            primoCheck.set(
                "Differenza da giustificare",
                0
            );


            primoCheck.set(
                "Stato di Riconciliazione",
                "OK"
            );
        }


        // ====================================================
        // 5C. RICONCILIAZIONE DAL SECONDO CHECK
        // ====================================================

        for (
            var q = 1;
            q < checkContoOrdinati.length;
            q++
        ) {

            var checkPrecedente =
                checkContoOrdinati[
                    q - 1
                ];

            var checkCorrente =
                checkContoOrdinati[q];


            var dataPrecedente =
                checkPrecedente.field(
                    "Data e Ora"
                );

            var dataCorrente =
                checkCorrente.field(
                    "Data e Ora"
                );


            if (
                !dataPrecedente ||
                !dataCorrente
            ) {

                continue;
            }


            var momentoPrecedente =
                moment(
                    dataPrecedente
                );

            var momentoCorrente =
                moment(
                    dataCorrente
                );

            var timestampCorrente =
                momentoCorrente
                .toDate()
                .getTime();


            var saldoPrecedente =
                Number(
                    checkPrecedente.field(
                        "Disponibilità Netta"
                    )
                );

            var saldoCorrente =
                Number(
                    checkCorrente.field(
                        "Disponibilità Netta"
                    )
                );


            if (
                !isFinite(saldoPrecedente) ||
                !isFinite(saldoCorrente)
            ) {

                continue;
            }


            // ================================================
            // 5D. CERCA RICONCILIAZIONE DEL CHECK
            // ================================================

            var riconciliazione =
                null;


            for (
                var r = 0;
                r < tutteTransazioni.length;
                r++
            ) {

                var transazioneR =
                    tutteTransazioni[r];


                if (
                    transazioneR.field(
                        "Origine"
                    ) != "Calcolata" ||
                    transazioneR.field(
                        "Categoria"
                    ) != "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        transazioneR.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var checkOrigineR =
                    transazioneR.field(
                        "Check Saldo Origine"
                    );


                var appartiene =
                    false;


                if (
                    checkOrigineR &&
                    checkOrigineR.length > 0
                ) {

                    for (
                        var ro = 0;
                        ro < checkOrigineR.length;
                        ro++
                    ) {

                        if (
                            checkOrigineR[ro].id ==
                            checkCorrente.id
                        ) {

                            appartiene =
                                true;

                            break;
                        }
                    }
                }


                // ============================================
                // RECUPERO LEGACY
                // ============================================

                if (
                    !appartiene &&
                    (
                        !checkOrigineR ||
                        checkOrigineR.length == 0
                    )
                ) {

                    var dataR =
                        transazioneR.field(
                            "Data e Ora"
                        );


                    if (
                        dataR
                    ) {

                        var timestampR =
                            moment(
                                dataR
                            )
                            .toDate()
                            .getTime();


                        if (
                            timestampR ==
                            timestampCorrente
                        ) {

                            appartiene =
                                true;


                            transazioneR.link(
                                "Check Saldo Origine",
                                checkCorrente
                            );
                        }
                    }
                }


                if (
                    appartiene
                ) {

                    riconciliazione =
                        transazioneR;

                    break;
                }
            }


            // ================================================
            // 5E. MOVIMENTI REALI NELL'INTERVALLO
            // ================================================

            var entrateIntervallo =
                0;

            var usciteIntervallo =
                0;


            for (
                var m = 0;
                m < tutteTransazioni.length;
                m++
            ) {

                var movimento =
                    tutteTransazioni[m];


                var origineMovimento =
                    movimento.field(
                        "Origine"
                    );

                var categoriaMovimento =
                    movimento.field(
                        "Categoria"
                    );


                if (
                    origineMovimento ==
                        "Calcolata" &&
                    categoriaMovimento ==
                        "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        movimento.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataMovimento =
                    movimento.field(
                        "Data e Ora"
                    );


                if (
                    !dataMovimento
                ) {

                    continue;
                }


                var momentoMovimento =
                    moment(
                        dataMovimento
                    );


                if (
                    !momentoMovimento.isAfter(
                        momentoPrecedente
                    )
                ) {

                    continue;
                }


                if (
                    momentoMovimento.isAfter(
                        momentoCorrente
                    )
                ) {

                    continue;
                }


                var importoMovimento =
                    Number(
                        movimento.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoMovimento
                    )
                ) {

                    continue;
                }


                var tipoMovimento =
                    movimento.field(
                        "Tipo"
                    );


                if (
                    tipoMovimento ==
                    "Entrata"
                ) {

                    entrateIntervallo +=
                        importoMovimento;
                }


                else if (
                    tipoMovimento ==
                    "Uscita"
                ) {

                    usciteIntervallo +=
                        importoMovimento;
                }
            }


            entrateIntervallo =
                arrotonda2(
                    entrateIntervallo
                );

            usciteIntervallo =
                arrotonda2(
                    usciteIntervallo
                );


            // ================================================
            // 5F. DIFFERENZA
            // ================================================

            var saldoAtteso =
                arrotonda2(
                    saldoPrecedente +
                    entrateIntervallo -
                    usciteIntervallo
                );


            var differenza =
                arrotonda2(
                    saldoCorrente -
                    saldoAtteso
                );


            // ================================================
            // 5G. BLOCCO DI VERIFICA ENTRATE
            // ================================================
            //
            // Un Check successivo al primo NON viene chiuso
            // automaticamente. Prima deve essere confermato
            // tramite l'Action "Verifica Entrate".
            //
            // Se il Check precedente non è chiuso, anche quello
            // corrente resta bloccato.
            // ================================================

            var precedenteVerificato =
                checkPrecedente.field(
                    "Entrate Verificate"
                ) === true;

            var statoPrecedente =
                checkPrecedente.field(
                    "Stato di Riconciliazione"
                );


            if (
                !precedenteVerificato ||
                statoPrecedente != "OK"
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "CHECK PRECEDENTE DA CHIUDERE"
                );

                continue;
            }


            var entrateVerificate =
                checkCorrente.field(
                    "Entrate Verificate"
                ) === true;


            if (
                !entrateVerificate
            ) {

                // Qualsiasi riconciliazione precedente viene
                // sospesa finché il Check non viene verificato.
                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );


                var statoCorrente =
                    checkCorrente.field(
                        "Stato di Riconciliazione"
                    );


                // Se l'utente ha già dichiarato "TUTTE REGISTRATE"
                // ma resta una differenza positiva, manteniamo
                // l'avviso ENTRATE DA REGISTRARE.
                if (
                    differenza > 0 &&
                    statoCorrente ==
                        "ENTRATE DA REGISTRARE"
                ) {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "ENTRATE DA REGISTRARE"
                    );

                } else {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "VERIFICA ENTRATE"
                    );
                }


                continue;
            }


            // ================================================
            // 5H. DIFFERENZA NEGATIVA - CHECK VERIFICATO
            // ================================================

            if (
                differenza < 0
            ) {

                var importoAltreSpese =
                    arrotonda2(
                        Math.abs(
                            differenza
                        )
                    );


                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Transazione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Descrizione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Data e Ora",
                        timestampCorrente
                    );

                    riconciliazione.set(
                        "Importo",
                        importoAltreSpese
                    );

                    riconciliazione.set(
                        "Tipo",
                        "Uscita"
                    );

                    riconciliazione.set(
                        "Categoria",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Origine",
                        "Calcolata"
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Conto"
                            ),
                            idConto
                        )
                    ) {

                        riconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );
                    }


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Saldo Origine"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Saldo Origine",
                            checkCorrente
                        );
                    }
                }


                else {

                    var nuovaRiconciliazione =
                        libreriaTransazioni.create({

                            "Transazione":
                                "Altre Spese",

                            "Descrizione":
                                "Altre Spese",

                            "Data e Ora":
                                timestampCorrente,

                            "Importo":
                                importoAltreSpese,

                            "Tipo":
                                "Uscita",

                            "Categoria":
                                "Altre Spese",

                            "Origine":
                                "Calcolata"

                        });


                    if (
                        nuovaRiconciliazione
                    ) {

                        // Le relazioni vengono collegate DOPO create().
                        // Su Memento Desktop il passaggio delle relazioni
                        // direttamente dentro create() non è affidabile.
                        nuovaRiconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );

                        nuovaRiconciliazione.link(
                            "Check Saldo Origine",
                            checkCorrente
                        );


                        riconciliazioniCreate.push(
                            nuovaRiconciliazione
                        );

                        tutteTransazioni.push(
                            nuovaRiconciliazione
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
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
            }


            // ================================================
            // 5I. DIFFERENZA POSITIVA - CHECK DA RIAPRIRE
            // ================================================

            else if (
                differenza > 0
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Saldo Origine"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Saldo Origine",
                            checkCorrente
                        );
                    }
                }


                // Una differenza positiva non può essere
                // chiusa come spesa. Il Check torna non verificato.
                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "ENTRATE DA REGISTRARE"
                );
            }


            // ================================================
            // 5J. DIFFERENZA ZERO - CHECK VERIFICATO
            // ================================================

            else {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );

                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Saldo Origine"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Saldo Origine",
                            checkCorrente
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
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
            }
        }


        // ====================================================
        // 6. SALDO PROGRESSIVO DEL CONTO
        // ====================================================

        var saldoIniziale =
            Number(
                conto.field(
                    "Saldo Iniziale"
                )
            );

        var dataSaldoIniziale =
            conto.field(
                "Data Saldo Iniziale"
            );


        if (
            isFinite(
                saldoIniziale
            ) &&
            dataSaldoIniziale
        ) {

            var momentoSaldoIniziale =
                moment(
                    dataSaldoIniziale
                );


            var movimentiProgressivo =
                [];


            for (
                var fp = 0;
                fp < tutteTransazioni.length;
                fp++
            ) {

                var movimentoFiltro =
                    tutteTransazioni[fp];


                if (
                    !contieneConto(
                        movimentoFiltro.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataFiltro =
                    movimentoFiltro.field(
                        "Data e Ora"
                    );


                if (
                    !dataFiltro
                ) {

                    continue;
                }


                var momentoFiltro =
                    moment(
                        dataFiltro
                    );


                if (
                    momentoFiltro.isBefore(
                        momentoSaldoIniziale
                    )
                ) {

                    continue;
                }


                var tipoFiltro =
                    movimentoFiltro.field(
                        "Tipo"
                    );

                var categoriaFiltro =
                    movimentoFiltro.field(
                        "Categoria"
                    );


                if (
                    tipoFiltro ==
                        "Bilancio" &&
                    categoriaFiltro ==
                        "Bilancio Iniziale"
                ) {

                    continue;
                }


                movimentiProgressivo.push(
                    movimentoFiltro
                );
            }


            movimentiProgressivo.sort(
                ordinaCronologicamente
            );


            var saldoProgressivo =
                arrotonda2(
                    saldoIniziale
                );


            for (
                var p = 0;
                p < movimentiProgressivo.length;
                p++
            ) {

                var movimentoProgressivo =
                    movimentiProgressivo[p];


                var tipoProgressivo =
                    movimentoProgressivo.field(
                        "Tipo"
                    );

                var importoProgressivo =
                    Number(
                        movimentoProgressivo.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoProgressivo
                    )
                ) {

                    continue;
                }


                if (
                    tipoProgressivo ==
                    "Entrata"
                ) {

                    saldoProgressivo +=
                        importoProgressivo;
                }


                else if (
                    tipoProgressivo ==
                    "Uscita"
                ) {

                    saldoProgressivo -=
                        importoProgressivo;
                }


                else {

                    continue;
                }


                saldoProgressivo =
                    arrotonda2(
                        saldoProgressivo
                    );


                movimentoProgressivo.set(
                    "Saldo Progressivo",
                    saldoProgressivo
                );


                movimentoProgressivo.set(
                    "Saldo Progressivo Visualizzato",
                    formattaSaldoProgressivo(
                        saldoProgressivo
                    )
                );
            }
        }


        // ====================================================
        // 7. SALDO ATTUALE = ULTIMO CHECK
        // ====================================================

        if (
            checkContoOrdinati.length > 0
        ) {

            var ultimoCheckConto =
                checkContoOrdinati[
                    checkContoOrdinati.length - 1
                ];


            var saldoUltimoCheck =
                Number(
                    ultimoCheckConto.field(
                        "Disponibilità Netta"
                    )
                );


            if (
                isFinite(
                    saldoUltimoCheck
                )
            ) {

                conto.set(
                    "Saldo Attuale",
                    saldoUltimoCheck
                );
            }
        }
    }


    // ========================================================
    // 8. DATA DI RIFERIMENTO DASHBOARD
    // ========================================================

    var momentoDashboard =
        null;


    for (
        var dc = 0;
        dc < tuttiCheck.length;
        dc++
    ) {

        var dataCheckDashboard =
            tuttiCheck[dc].field(
                "Data e Ora"
            );


        if (
            !dataCheckDashboard
        ) {

            continue;
        }


        var momentoCheckDashboard =
            moment(
                dataCheckDashboard
            );


        if (
            !momentoDashboard ||
            momentoCheckDashboard.isAfter(
                momentoDashboard
            )
        ) {

            momentoDashboard =
                momentoCheckDashboard;
        }
    }


    // ========================================================
    // 9. DASHBOARD
    // ========================================================

    if (
        libreriaDashboard &&
        momentoDashboard
    ) {

        var cardsDashboard =
            libreriaDashboard.entries();


        var cardSaldoAttuale = null;
        var cardSaldoDisponibile = null;
        var cardSalvadanaio = null;
        var cardAltreSpeseMese = null;
        var cardSpeseFisseMese = null;
        var cardEntrateUsciteMese = null;


        for (
            var c = 0;
            c < cardsDashboard.length;
            c++
        ) {

            var card =
                cardsDashboard[c];

            var codiceKPI =
                card.field(
                    "Codice KPI"
                );


            if (
                codiceKPI ==
                "SALDO_ATTUALE"
            ) {

                cardSaldoAttuale =
                    card;
            }

            else if (
                codiceKPI ==
                "SALDO_DISPONIBILE"
            ) {

                cardSaldoDisponibile =
                    card;
            }

            else if (
                codiceKPI ==
                "SALVADANAIO"
            ) {

                cardSalvadanaio =
                    card;
            }

            else if (
                codiceKPI ==
                "ALTRE_SPESE_MESE"
            ) {

                cardAltreSpeseMese =
                    card;
            }

            else if (
                codiceKPI ==
                "SPESE_FISSE_MESE"
            ) {

                cardSpeseFisseMese =
                    card;
            }

            else if (
                codiceKPI ==
                "ENTRATE_USCITE_MESE"
            ) {

                cardEntrateUsciteMese =
                    card;
            }
        }


        // ====================================================
        // 9A. FORMATO DASHBOARD
        // ====================================================

        function formattaEuroDashboard(
            valore
        ) {

            var numero =
                Number(
                    valore
                );


            if (
                !isFinite(numero)
            ) {

                return "";
            }


            var parti =
                Math.abs(numero)
                .toFixed(2)
                .split(".");


            var intero =
                parti[0].replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    "."
                );


            var risultato =
                intero +
                "," +
                parti[1] +
                " €";


            if (
                numero < 0
            ) {

                risultato =
                    "- " +
                    risultato;
            }


            return risultato;
        }


        function formattaSaldoDashboard(
            valore
        ) {

            return (
                "\u26C3 " +
                formattaEuroDashboard(
                    valore
                )
            );
        }


        function nomeMeseDashboard(
            numeroMese
        ) {

            var mesi = [
                "GENNAIO",
                "FEBBRAIO",
                "MARZO",
                "APRILE",
                "MAGGIO",
                "GIUGNO",
                "LUGLIO",
                "AGOSTO",
                "SETTEMBRE",
                "OTTOBRE",
                "NOVEMBRE",
                "DICEMBRE"
            ];


            return mesi[
                numeroMese
            ];
        }


        // ====================================================
        // 9B. SALDO ATTUALE COMPLESSIVO
        // ====================================================

        var saldoAttualeDashboard =
            0;


        for (
            var cd = 0;
            cd < tuttiConti.length;
            cd++
        ) {

            var contoDashboard =
                tuttiConti[cd];


            if (
                !contoDashboard.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            var saldoConto =
                Number(
                    contoDashboard.field(
                        "Saldo Attuale"
                    )
                );


            if (
                isFinite(
                    saldoConto
                )
            ) {

                saldoAttualeDashboard +=
                    saldoConto;
            }
        }


        saldoAttualeDashboard =
            arrotonda2(
                saldoAttualeDashboard
            );


        if (
            cardSaldoAttuale
        ) {

            cardSaldoAttuale.set(
                "Saldo Attuale",
                saldoAttualeDashboard
            );

            cardSaldoAttuale.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoAttualeDashboard
                )
            );

            cardSaldoAttuale.set(
                "Valore Secondario",
                ""
            );

            cardSaldoAttuale.set(
                "Ultimo Check Saldo",
                momentoDashboard
                .toDate()
                .getTime()
            );
        }


        // ====================================================
        // 9C. PERIODO
        // ====================================================

        var inizioMese =
            moment(
                momentoDashboard
            )
            .startOf(
                "month"
            );


        // ====================================================
        // 9D. SPESE FISSE PREVISTE
        // ====================================================

        var speseFissePrevisteMese =
            0;


        if (
            libreriaSpeseFisseDashboard
        ) {

            var elencoSpeseFisse =
                libreriaSpeseFisseDashboard
                .entries();


            for (
                var sf = 0;
                sf < elencoSpeseFisse.length;
                sf++
            ) {

                var importoMensile =
                    Number(
                        elencoSpeseFisse[sf]
                        .field(
                            "Importo Mese [1]"
                        )
                    );


                if (
                    isFinite(
                        importoMensile
                    )
                ) {

                    speseFissePrevisteMese +=
                        importoMensile;
                }
            }


            speseFissePrevisteMese =
                arrotonda2(
                    speseFissePrevisteMese
                );
        }


        // ====================================================
        // 9E. SALVADANAI
        // ====================================================

        var totaleSalvadanaio =
            0;


        if (
            libreriaSalvadanaioDashboard
        ) {

            var elencoSalvadanai =
                libreriaSalvadanaioDashboard
                .entries();


            for (
                var sv = 0;
                sv < elencoSalvadanai.length;
                sv++
            ) {

                var salvadanaio =
                    elencoSalvadanai[sv];


                if (
                    !salvadanaio.field(
                        "Attivo"
                    )
                ) {

                    continue;
                }


                var nominale =
                    Number(
                        salvadanaio.field(
                            "Importo Salvadanaio"
                        )
                    );


                if (
                    !isFinite(
                        nominale
                    )
                ) {

                    nominale = 0;
                }


                var anticipato =
                    Number(
                        salvadanaio.field(
                            "Anticipato"
                        )
                    );


                if (
                    !isFinite(
                        anticipato
                    )
                ) {

                    anticipato = 0;
                }


                var valoreEffettivo =
                    salvadanaio.field(
                        "Importo Effettivo"
                    );


                var effettivo;


                if (
                    valoreEffettivo === null ||
                    valoreEffettivo === undefined ||
                    valoreEffettivo === ""
                ) {

                    effettivo =
                        nominale -
                        anticipato;
                }

                else {

                    effettivo =
                        Number(
                            valoreEffettivo
                        );


                    if (
                        !isFinite(
                            effettivo
                        )
                    ) {

                        effettivo =
                            nominale -
                            anticipato;
                    }
                }


                if (
                    effettivo < 0
                ) {

                    effettivo = 0;
                }


                totaleSalvadanaio +=
                    effettivo;
            }


            totaleSalvadanaio =
                arrotonda2(
                    totaleSalvadanaio
                );
        }


        if (
            cardSalvadanaio
        ) {

            cardSalvadanaio.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    totaleSalvadanaio
                )
            );

            cardSalvadanaio.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9F. TOTALI MENSILI
        // ====================================================

        var altreSpeseMese = 0;
        var speseFisseMese = 0;
        var entrateMese = 0;
        var usciteMese = 0;


        for (
            var x = 0;
            x < tutteTransazioni.length;
            x++
        ) {

            var movimentoKPI =
                tutteTransazioni[x];


            var categoriaKPI =
                movimentoKPI.field(
                    "Categoria"
                );

            var tipoKPI =
                movimentoKPI.field(
                    "Tipo"
                );

            var dataKPI =
                movimentoKPI.field(
                    "Data e Ora"
                );

            var importoKPI =
                Number(
                    movimentoKPI.field(
                        "Importo"
                    )
                );


            if (
                !dataKPI ||
                !isFinite(
                    importoKPI
                )
            ) {

                continue;
            }


            var momentoKPI =
                moment(
                    dataKPI
                );


            // Dashboard = fotografia fino all'ultimo Check.

            if (
                momentoKPI.isAfter(
                    momentoDashboard
                )
            ) {

                continue;
            }


            if (
                momentoKPI.isBefore(
                    inizioMese
                )
            ) {

                continue;
            }


            if (
                tipoKPI ==
                    "Bilancio" &&
                categoriaKPI ==
                    "Bilancio Iniziale"
            ) {

                continue;
            }


            if (
                tipoKPI ==
                "Entrata"
            ) {

                entrateMese +=
                    importoKPI;
            }


            else if (
                tipoKPI ==
                "Uscita"
            ) {

                usciteMese +=
                    importoKPI;


                if (
                    categoriaKPI ==
                    "Altre Spese"
                ) {

                    altreSpeseMese +=
                        importoKPI;
                }


                if (
                    categoriaKPI ==
                    "Spesa Fissa"
                ) {

                    speseFisseMese +=
                        importoKPI;
                }
            }
        }


        altreSpeseMese =
            arrotonda2(
                altreSpeseMese
            );

        speseFisseMese =
            arrotonda2(
                speseFisseMese
            );

        entrateMese =
            arrotonda2(
                entrateMese
            );

        usciteMese =
            arrotonda2(
                usciteMese
            );


        // ====================================================
        // 9G. SPESE FISSE RESIDUE
        // ====================================================

        var speseFisseResidue =
            arrotonda2(
                speseFissePrevisteMese -
                speseFisseMese
            );


        if (
            speseFisseResidue < 0
        ) {

            speseFisseResidue = 0;
        }


        // ====================================================
        // 9H. SALDO DISPONIBILE
        // ====================================================

        var saldoDisponibile =
            arrotonda2(
                saldoAttualeDashboard -
                totaleSalvadanaio -
                speseFisseResidue
            );


        if (
            cardSaldoDisponibile
        ) {

            cardSaldoDisponibile.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoDisponibile
                )
            );

            cardSaldoDisponibile.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9I. ALTRE SPESE
        // ====================================================

        if (
            cardAltreSpeseMese
        ) {

            cardAltreSpeseMese.set(
                "Altre Spese - Mese",
                altreSpeseMese
            );

            cardAltreSpeseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    altreSpeseMese
                )
            );

            cardAltreSpeseMese.set(
                "Periodo Dashboard",
                nomeMeseDashboard(
                    momentoDashboard.month()
                ) +
                " " +
                momentoDashboard.year()
            );
        }


        // ====================================================
        // 9J. SPESE FISSE
        // ====================================================

        if (
            cardSpeseFisseMese
        ) {

            cardSpeseFisseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    speseFisseMese
                )
            );

            cardSpeseFisseMese.set(
                "Valore Secondario",
                "/ " +
                formattaEuroDashboard(
                    speseFissePrevisteMese
                )
            );

            cardSpeseFisseMese.set(
                "Periodo Dashboard",
                nomeMeseDashboard(
                    momentoDashboard.month()
                ) +
                " " +
                momentoDashboard.year()
            );
        }


        // ====================================================
        // 9K. ENTRATE / USCITE
        // ====================================================

        if (
            cardEntrateUsciteMese
        ) {

            cardEntrateUsciteMese.set(
                "Valore Entrata",
                formattaEuroDashboard(
                    entrateMese
                )
            );

            cardEntrateUsciteMese.set(
                "Separatore",
                "/"
            );

            cardEntrateUsciteMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    usciteMese
                )
            );

            cardEntrateUsciteMese.set(
                "Periodo Dashboard",
                nomeMeseDashboard(
                    momentoDashboard.month()
                ) +
                " " +
                momentoDashboard.year()
            );

            cardEntrateUsciteMese.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 9L. CONTROLLI DASHBOARD
        // ====================================================

        if (
            !cardSaldoAttuale
        ) {

            message(
                "ATTENZIONE: card SALDO_ATTUALE non trovata."
            );
        }


        if (
            !cardSaldoDisponibile
        ) {

            message(
                "ATTENZIONE: card SALDO_DISPONIBILE non trovata."
            );
        }


        if (
            !cardSalvadanaio
        ) {

            message(
                "ATTENZIONE: card SALVADANAIO non trovata."
            );
        }


        if (
            !cardAltreSpeseMese
        ) {

            message(
                "ATTENZIONE: card ALTRE_SPESE_MESE non trovata."
            );
        }


        if (
            !cardSpeseFisseMese
        ) {

            message(
                "ATTENZIONE: card SPESE_FISSE_MESE non trovata."
            );
        }


        if (
            !cardEntrateUsciteMese
        ) {

            message(
                "ATTENZIONE: card ENTRATE_USCITE_MESE non trovata."
            );
        }
    }


} // fine ricalcolaFinanze()
