import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { EventEmitterService } from '../event-emitter.service';
import { ParseResult, QueryResult } from '../models';
import { HttpSerivce } from '../solr-adapter.service';
@Component({
  selector: 'searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.less']
})
export class SearchbarComponent implements OnInit {
  @ViewChild('acc') acc: any;
  @ViewChild('form') form: any;
  @ViewChild('comb1') comb1: any;
  @ViewChild('comb2') comb2: any;
  @ViewChild('comb3') comb3: any;
  @ViewChild('comb4') comb4: any;
  @ViewChild('satzUntersuchenRender') satzUntersuchenRender: any;
  @ViewChild('satzUntersuchenParse') satzUntersuchenParse: any;
  @ViewChild("subj") autoSubj: MatAutocomplete;
  @ViewChild("autoVolltext") autoVoll: MatAutocomplete;
  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;
  constructor(
    private eventEmitterService: EventEmitterService,
    private solr: HttpSerivce
  ) { }
  volltext = '';
  valueRoot = "";
  valueSubj = "";
  valueRest = "";
  valueAkk = "";
  valueDat = "";
  valueSatzUntersuchen = "";

  valueCourtId = "";
  valueCourtSlug = "";
  valueFileNumber = "";

  volltextOptions: string[] = [];
  subjektOptions: string[] = [];
  restOptions: string[] = [];
  rootOptions: string[] = [];
  akkOptions: string[] = [];
  datOptions: string[] = [];

  currentPage = 1;
  itemsPerPage = 15;

  results: QueryResult[] = [];
  lastSvg = "";
  satzUntersuchenSvgResult = "";
  totalResultCount: number;
  satzUntersuchenParseResult: ParseResult = {} as ParseResult;

  valueType: string;
  types: string[] = ["Urteil",
    "Beschluss",
    "Schlussantrag des Generalanwalts",
    "Endurteil",
    "Stattgebender Kammerbeschluss",
    "Ablehnung einstweilige Anordnung",
    "Nichtannahmebeschluss",
    "GeB"];

  valueMoneyMin = "";
  valueMoneyMax = "";
  valueSentimentSentenceMin = "";
  valueSentimentSentenceMax = "";

  lastQueryObj: any;
  lastQueryWasSentence: boolean;

  ngOnInit(): void {

  }

  /*
   * Called when the input of the full sentence input-field changed.
   * Used to fetch predictions.   
   */
  inputChanged(event: any) {
    let inputval: string = this.volltext.trim();
    this.volltextOptions = [];
    // query the trigram core that also contains fivegrams for matches 
    this.solr.queryTrigram(this.volltext.trim()).subscribe((resp: any) => {
      let found = resp.response.docs;
      this.volltextOptions = found.map((doc: any) => doc.ngrams.join(" "))
      this.volltextOptions.push("--End of Ngrams Prediction --");
    });
    let inputForSkipGram: string = inputval;

    // only use the last word inside the input field 
    let splitted = inputval.trim().split(" ");
    if (splitted.length > 1) {
      inputForSkipGram = splitted[splitted.length - 1]
    }
    this.solr.predictSurroundings(inputForSkipGram.trim()).subscribe((resp: any) => {
      let found = resp;
      let counter: number = 0;
      found.forEach((entry: any) => {
        counter++;
        // put the first two options infront of the word, and the last two behind it
        if (entry.trim().toLocaleLowerCase() != inputForSkipGram.trim().toLocaleLowerCase()) {
          if (counter <= 2) this.volltextOptions.push(entry + " " + inputval);
          else this.volltextOptions.push(inputval + " " + entry);
        }
      });
    });
  }

  /**
   * Sends request to the backend to render graph and displays it
   * @param event event
   * @param item the item in the result that caused the event
   */
  renderGraph(event: any, item: QueryResult) {
    this.solr.renderSentence(item.fullSentence).subscribe(resp => {
      this.lastSvg = resp.toString();

      let currentElement: HTMLElement | null = event.target.parentElement as HTMLElement;
      while (currentElement && !currentElement.classList.contains("card-body")) {
        currentElement = currentElement.parentElement
      }
      if (currentElement) {
        let container: HTMLElement = currentElement.getElementsByClassName("svg-container")[0] as HTMLElement;
        let svgStr = resp.toString().trim();
        let newDiv: HTMLElement = document.createElement("div")
        newDiv.innerHTML = svgStr;
        container.appendChild(newDiv);
      }
      else console.log("Current element was also null!!")
    });
  }
  /**
   * Downloads the graph 
   * @param event event
   * @param item the item in the result that caused the event
   */
  downloadGraph(event: any, item: QueryResult) {
    // TODO Fix if sentence isnt an array anymore
    let currentElement: HTMLElement | null = event.target.parentElement as HTMLElement;
    while (currentElement && !currentElement.classList.contains("card-body")) {
      currentElement = currentElement.parentElement
    }
    if (currentElement) {
      let container: HTMLElement = currentElement.getElementsByClassName("svg-container")[0] as HTMLElement;
      let svgStr = container.innerHTML;
      const blob = new Blob([svgStr]);
      const element = document.createElement("a");
      element.download = item.case_id + "_" + item.sentence_number + ".svg";
      element.href = window.URL.createObjectURL(blob);
      element.click();
      element.remove();
    }
    else console.log("Current element was also null!!")
  }

  /**
   * returns the string or * if the string is empty
   * @param s string to validate
   */
  validateStr(s: string) {
    return s != "" ? s : "*"
  }

  /**
   * Build the query when "Go" was clicked
   */
  onSubmit() {
    let volltext = this.volltext;
    let comb1 = this.comb1.nativeElement.value;
    let comb2 = this.comb2.nativeElement.value;
    let akk = this.valueAkk;
    let dat = this.valueDat;
    let comb3 = this.comb3.nativeElement.value;
    let root = this.valueRoot;
    let comb4 = this.comb4.nativeElement.value;
    let rest = this.valueRest;
    let fq = "(";
    let lastConjunction: string = "AND"

    if (this.valueSubj.length > 0) {
      fq += "subjekt:" + this.validateStr(this.valueSubj);
      fq += " " + comb1 + " ";
      lastConjunction = comb1;
    }
    if (akk.length > 0) {
      fq += "akkusativobjekt:" + this.validateStr(akk);
      fq += " " + comb2 + " ";
      lastConjunction = comb2;
    }
    if (dat.length > 0) {
      fq += "dativobjekt:" + this.validateStr(dat);
      fq += " " + comb3 + " ";
      lastConjunction = comb3;
    }
    if (root.length > 0) {
      fq += "root:" + this.validateStr(root);
      fq += " " + comb4 + " ";

      lastConjunction = comb4;
    }
    if (rest.length > 0) {
      fq += "rest:" + this.validateStr(rest);
      fq += " OR ";

      lastConjunction = "OR";
    }
    if (this.valueCourtId) {
      fq += "court_id:" + this.validateStr(this.valueCourtId);
      fq += " OR ";
      lastConjunction = "OR";
    }
    if (this.valueCourtSlug) {
      fq += "court_slug:" + this.validateStr(this.valueCourtSlug);
      fq += " OR ";
      lastConjunction = "OR";
    }
    if (this.valueFileNumber) {
      fq += "file_number:" + this.validateStr(this.valueFileNumber);
      fq += " OR ";
      lastConjunction = "OR";
    }
    if (this.valueType) {
      fq += "type:" + this.validateStr(this.valueType);
      fq += " OR ";
      lastConjunction = "OR";
    }
    if (this.valueMoneyMin || this.valueMoneyMax) {
      fq += "geldbetrag:[" + this.validateStr(this.valueMoneyMin) + " TO " + this.validateStr(this.valueMoneyMax) + "]";
      fq += " OR ";
      lastConjunction = "OR";
    }
    if (this.valueSentimentSentenceMin || this.valueSentimentSentenceMax) {
      fq += "geldbetrag:[" + this.validateStr(this.valueSentimentSentenceMin) + " TO " + this.validateStr(this.valueSentimentSentenceMax) + "]";
      fq += " OR ";
      lastConjunction = "OR";
    }
    fq = fq.substring(0, fq.length - (1 + lastConjunction.length))
    fq += ")"
    let queryObj: any = {
      "params": {
        "q": "fullSentence:(" + this.validateStr(volltext) + ")",
        "wt": "json",
        "rows": this.itemsPerPage
      }
    }
    // if only the vollText field is entered and no other field, the fq string will have the value ")"
    if (fq != ")") {
      // if this is not the case lets append the fq to the queryObj
      queryObj["params"]["fq"] = fq;
    }
    console.log(queryObj);
    this.lastQueryObj = queryObj;
    this.lastQueryWasSentence = true;
    this.solr.querySolr(queryObj).subscribe((res: any) => {
      this.setSentenceResults(res);
      // nothing was found for the sentences, so lets search in the full docs
      if (this.results.length == 0) {
        alert("Nichts gefunden, Suche deswegen im gesamten Volltext")
        let qStr = "content:(";
        if (volltext.length > 0) qStr += volltext + " OR ";
        if (akk.length > 0) qStr += akk + " OR ";
        if (dat.length > 0) qStr += dat + " OR ";
        if (this.valueSubj.length > 0) qStr += this.valueSubj + " OR ";
        if (root.length > 0) qStr += root + " OR ";
        if (rest.length > 0) qStr += rest + " OR ";
        qStr = qStr.substring(0, qStr.length - (" OR ".length))
        qStr += ")";
        let queryObj = {
          "params": {
            "q": qStr,
            "wt": "json",
          }
        }
        this.lastQueryObj = queryObj;
        this.lastQueryWasSentence = false;
        this.solr.queryFullDocs(queryObj).subscribe((res: any) => {
          this.setFullResults(res);
        });
      }
    });
  }

  /**
   * Sets the results if they were queried from full cases
   * @param res the response from solr
   */
  private setFullResults(res: any) {
    this.results = [];
    res.response.docs.forEach((doc: any) => {
      this.results.push(
        {
          date: doc.date,
          fileNumber: doc.fileNumber,
          slug: doc.slug,
          type: doc.type,
          sentiment: 0,
          sentence_sentiment: 0,
          case_id: doc.case_id,
          fullSentence: "n/a",
          court_id: doc.court_id,
          court_name: "n/a",
          court_slug: "n/a",
          court_city: "n/a",
          court_state: "n/a",
          court_jurisdiction: "n/a",
          court_level_of_appeal: "n/a",
          file_Number: doc.file_number,
          created_date: doc.created_date,
          updated_date: doc.updated_date,
          ecli: doc.ecli,
          sentence_number: -1,
          root: ["n/a"],
          akkusativobjekt: ["n/a"],
          dativobjekt: ["n/a"],
          rest: ["n/a"],
          subjekt: ["n/a"],
          geldbetrag: [-1, -1, -1],
          fullCaseText: doc.content,
        } as QueryResult);
    });
  }

  /**
   * Sets the results if they were queried from sentences only
   * @param res the response from solr
   */
  private setSentenceResults(res: any) {
    this.results = [];
    this.totalResultCount = res.response.numFound;
    res.response.docs.forEach((doc: any) => {
      this.results.push(
        {
          date: doc.date,
          slug: doc.slug,
          type: doc.type,
          sentiment: doc.sentiment,
          sentence_sentiment: doc.sentence_sentiment,
          case_id: doc.case_id,
          fullSentence: doc.fullSentence,
          court_id: doc.court_id,
          court_name: doc.court_name,
          court_slug: doc.court_slug,
          court_city: doc.court_city,
          court_state: doc.court_state,
          court_jurisdiction: doc.court_jurisdiction,
          court_level_of_appeal: doc.court_level_of_appeal,
          file_Number: doc.file_number,
          created_date: doc.created_date,
          updated_date: doc.updated_date,
          ecli: doc.ecli,
          sentence_number: doc.sentence_number,
          root: doc.root,
          akkusativobjekt: doc.akkusativobjekt,
          dativobjekt: doc.dativobjekt,
          rest: doc.rest,
          subjekt: doc.subjekt,
          geldbetrag: doc.geldbetrag,
          fullCaseText: ""
        } as QueryResult);
    });
  }

  /**
   * Renders the arbitrary input sentence from the user by request to backend
   * @param event event
   */
  renderSingleSentence(event: any) {
    this.solr.renderSentence(this.valueSatzUntersuchen).subscribe(resp => {
      this.satzUntersuchenRender.nativeElement.innerHTML = resp.toString();
    })
  }

  /**
   * Parses the arbitrary input sentence from the user by request to backend
   * @param event event
   */
  parseSingleSentence(event: any) {
    this.solr.parseSentence(this.valueSatzUntersuchen).subscribe(resp => {
      this.satzUntersuchenParseResult = resp as ParseResult;
      this.valueAkk = this.satzUntersuchenParseResult.AkkusativObjekt.toString();
      this.valueDat = this.satzUntersuchenParseResult.DativObjekt.toString();
      this.valueRoot = this.satzUntersuchenParseResult.ROOT.toString();
      this.valueRest = this.satzUntersuchenParseResult.Rest.toString();
      this.valueSubj = this.satzUntersuchenParseResult.Subjekt.toString();
    })
  }

  /**
   * Fetches the full case text from solr by item id 
   * @param event event 
   * @param item item that caused the event
   */
  lazyLoadFullCaseText(event: any, item: QueryResult) {
    if (item.fullCaseText.length == 0) {
      this.solr.getFullText(item.case_id).subscribe((resp: any) => {
        item.fullCaseText = resp.response.docs[0].content;
      })
    }
  }

  /**
   * Generates a query to solr to fill up the other fields with matching part of sentences
   * @param event event
   */
  parseInputAndFillUpFields(event: any) {
    let comb1 = this.comb1.nativeElement.value;
    let comb2 = this.comb2.nativeElement.value;
    let akk = this.valueAkk;
    let dat = this.valueDat;
    let comb3 = this.comb3.nativeElement.value;
    let root = this.valueRoot;
    let comb4 = this.comb4.nativeElement.value;
    let rest = this.valueRest;
    let fq = "(";
    let lastConjunction: string = "AND"

    if (this.valueSubj.length > 0) {
      fq += "subjekt:" + this.validateStr(this.valueSubj);
      fq += " " + comb1 + " ";
      lastConjunction = comb1;
    }
    if (akk.length > 0) {
      fq += "akkusativobjekt:" + this.validateStr(akk);
      fq += " " + comb2 + " ";
      lastConjunction = comb2;
    }
    if (dat.length > 0) {
      fq += "dativobjekt:" + this.validateStr(dat);
      fq += " " + comb3 + " ";
      lastConjunction = comb3;
    }
    if (root.length > 0) {
      fq += "root:" + this.validateStr(root);
      fq += " " + comb4 + " ";

      lastConjunction = comb4;
    }
    if (rest.length > 0) {
      fq += "rest:" + this.validateStr(rest);
      fq += " OR ";

      lastConjunction = "OR";
    }
    fq = fq.substring(0, fq.length - (1 + lastConjunction.length))
    fq += ")"
    let queryObj: any = {
      "params": {
        "q": "fullSentence:*",
        "wt": "json",
        "rows": 5
      }
    }
    // if only the vollText field is entered and no other field, the fq string will have the value ")"
    if (fq != ")") {
      // if this is not the case lets append the fq to the queryObj
      queryObj["params"]["fq"] = fq;
    } console.log(queryObj);
    this.solr.querySolr(queryObj).subscribe((res: any) => {
      let parseResults: ParseResult[] = [] as ParseResult[];
      console.log(res.response.docs.length);
      res.response.docs.forEach((doc: any) => {
        parseResults.push(
          {
            ROOT: doc.root,
            AkkusativObjekt: doc.akkusativobjekt,
            DativObjekt: doc.dativobjekt,
            Rest: doc.rest,
            Subjekt: doc.subjekt,
          } as ParseResult);
        // if (doc.akkusativobjekt) this.akkOptions.push(...this.getFirstNUnique(3, doc.akkusativobjekt));
        // if (doc.dativobjekt) this.datOptions.push(...this.getFirstNUnique(3, doc.dativobjekt));
        // if (doc.root) this.rootOptions.push(...this.getFirstNUnique(3, doc.root));
        // if (doc.rest) this.restOptions.push(...this.getFirstNUnique(3, doc.rest));
        // if (doc.subjekt) this.subjektOptions.push(...this.getFirstNUnique(3, doc.subjekt));

        // TODO push it nicely

        if (doc.akkusativobjekt) this.akkOptions.push(...this.getFirstNUnique(3, doc.akkusativobjekt, this.akkOptions));
        if (doc.dativobjekt) this.datOptions.push(...this.getFirstNUnique(3, doc.dativobjekt, this.datOptions));
        if (doc.root) this.rootOptions.push(...this.getFirstNUnique(3, doc.root, this.rootOptions));
        if (doc.rest) this.restOptions.push(...this.getFirstNUnique(3, doc.rest, this.restOptions));
        if (doc.subjekt) this.subjektOptions.push(...this.getFirstNUnique(3, doc.subjekt, this.subjektOptions));

        // if (doc.akkusativobjekt) this.akkOptions = this.akkOptions.concat(this.akkOptions, this.getFirstNUnique(3, doc.akkusativobjekt, this.akkOptions));
        // if (doc.dativobjekt) this.datOptions = this.datOptions.concat(this.datOptions, this.getFirstNUnique(3, doc.dativobjekt, this.datOptions));
        // if (doc.root) this.rootOptions = this.rootOptions.concat(this.rootOptions, this.getFirstNUnique(3, doc.root, this.rootOptions));
        // if (doc.rest) this.restOptions = this.restOptions.concat(this.restOptions, this.getFirstNUnique(3, doc.rest, this.restOptions));
        // if (doc.subjekt) this.subjektOptions = this.subjektOptions.concat(this.subjektOptions, this.getFirstNUnique(3, doc.subjekt, this.subjektOptions));
      });
      console.log("akk, dat, root, rest, subj")
      console.log(this.akkOptions, this.datOptions, this.rootOptions, this.restOptions, this.subjektOptions)
    });
  }

  private getFirstNUnique(n = 3, list: any, options: any) {
    let res: string[] = [];
    let cnt = 0;
    if (list.length <= n) {
      return list.filter((elem: string) => options.indexOf(elem) < 0);
    }
    while (res.length < n) {
      if (res.indexOf(list[cnt]) < 0 && options.indexOf(list[cnt] < 0)) {
        res.push(list[cnt])
      }
      cnt += 1;
    }
    return res;
  }

  public keydownSpace(event: any) {
    this.inputChanged(event);
  }

  /**
   * Lazy loads the next 15 results based on the newPage
   * @param newPage new page of the pagination element
   */
  public onPageChange(newPage: any): void {
    // this.pageSize = this.itemsPerPage * (pageNum - 1);
    let startNumber = (newPage - 1) * this.itemsPerPage;
    let queryObj = this.lastQueryObj;
    queryObj.params["start"] = startNumber
    this.lastQueryObj = queryObj;
    if (this.lastQueryWasSentence) {
      this.solr.querySolr(queryObj).subscribe((res: any) => {
        this.setSentenceResults(res);
      });
    }
    else {
      this.solr.queryFullDocs(queryObj).subscribe((res: any) => {
        this.setFullResults(res);
      });
    }
  }
}
