import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class HttpSerivce {

  constructor(private http: HttpClient) { }

  solrBase = "http://localhost:8983/solr";
  coreFull = "/jura_docs_full";
  coreParts = "/jura_docs";
  coreTrigrams = "/trigrams";

  backendBase = "http://localhost:5000";


  querySolr(queryParam: object) {
    return this.http.post(this.solrBase + this.coreParts + "/select", queryParam);
  }

  queryFullDocs(queryParam: object) {
    return this.http.post(this.solrBase + this.coreFull + "/select", queryParam);
  }

  queryTrigram(userInput: string) {
    let params = new HttpParams().set("q", "ngrams:(" + userInput + ")").set("sort", "count desc")

    return this.http.get(this.solrBase + this.coreTrigrams + "/select", { params: params });
  }

  parseSentence(sentence: string) {
    const myheader = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    let params = new HttpParams().set("sentence", sentence);
    return this.http.post(this.backendBase + "/parse", params, { headers: myheader });
  }

  renderSentence(sentence: string) {
    const myheader = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    let params = new HttpParams().set("sentence", sentence);
    return this.http.post(this.backendBase + "/render", params, { headers: myheader }).pipe(
      timeout(1000000)
    );
  }

  predictSurroundings(word: string) {
    const myheader = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    let params = new HttpParams().set("input", word);
    return this.http.post(this.backendBase + "/predict", params, { headers: myheader });
  }

  getFullText(case_id: string) {
    const params = new HttpParams().set("q", "case_id:" + case_id);
    return this.http.get(this.solrBase + this.coreFull + "/select", { params: params });
  }
}
