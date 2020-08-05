import React from "react";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Chart from './Chart';
import "./App.css";

class App extends React.Component {

  // maxDepth = to control how deep to search
  // currentDepth = to see the current depth of the nodes. can be more than maxDepth
  constructor() {
    super();

    this.state = {
      firstTime: true,
      currentDepth: 0,
      maxDepth: 0,
      query: '',
      selectedTerm: '',
      options: [],
      releatedTerms: [],
      toBeSearchedTerms: {},
      data: {},
      nodes: [],
      links: [],
      status: '',
      typing: false,
      typingTimeout: 0,
      searchTimeout: 0,
      PROXY_URL: 'https://cors-anywhere.herokuapp.com/',
      SEARCH_URL: 'https://suggestqueries.google.com/complete/search?client=firefox&q=',
    }

    this.onChange = this.onChange.bind(this);
    this.autoCompleteChange = this.autoCompleteChange.bind(this);
  }

  search = (vs, term) => {
    const searchTerm = vs ? term + ' vs ' : this.state.query;
    const SEARCH_URL = `${this.state.SEARCH_URL}${searchTerm}`

    return fetch(this.state.PROXY_URL + SEARCH_URL)
  }

  isMoreItemsLeftToSearch = () => {
    let termsToSearch = this.state.toBeSearchedTerms;
    for (const [key, value] of Object.entries(termsToSearch)) {
      if(value === 0) {
        return true;
      }
    }
    return false;
  }

  termToBeSearched = () => {
    let termsToSearch = this.state.toBeSearchedTerms;
    for (const [key, value] of Object.entries(termsToSearch)) {
      if(value === 0) {
        return key;
      }
    }
    return null;
  }

  cleanData = (searchTerm, terms) => {
    let cleanedTerms = [];
    
    terms.forEach((term, index) => {
      let query = term.slice(searchTerm.length + 4);

      // check for selectedTerm
      // check if already fetched
      // should not have spaces
      // check if contains multiple "vs"
      // console.log(query, ' ===>', cleanedTerms.indexOf(query));
      if(query.length > 0 &&
        cleanedTerms.length < 5 &&
        query.indexOf(searchTerm) === -1 &&
        query.indexOf(" ") === -1 &&
        cleanedTerms.indexOf(query) === -1 &&
        query.indexOf(" vs ") === -1) {
          cleanedTerms.push(term.slice(searchTerm.length + 4).trim().toLowerCase());
      }
    });
    return cleanedTerms;
  }

  createNodes = (searchTerm, depth) => {
    return [{"id": searchTerm, "group": (depth + 1)}];
  }

  createLinks = (searchTerm, terms) => {
    let links = [];
    terms.forEach((term, index) => {
      links.push(
        {
          "source": searchTerm,
          "target": term,
          "value": index + 1
        }
      )
    });
    return links;
  }

  generateData = () => {
    let nodes = this.state.nodes;
    let depth = this.state.currentDepth;
    if(Object.keys(this.state.toBeSearchedTerms).length > this.state.nodes.length) {
      for (const [key, value] of Object.entries(this.state.toBeSearchedTerms)) {
        if(value === 0) {
          depth += 1
          nodes.push(
            {"group": depth, "id": key}
          )
        }
      }
    }


    this.setState({
      data: {
        "nodes": nodes,
        "links": this.state.links
      }
    })
  }

  setOptions = () => {
    this.search(false, '')
      .then(res => res.json())
      .then(data => {
        this.setState({
          options: data[1]
        });
      })
  }

  setRelatedTerms = (searchTerm) => {
    this.search(true, searchTerm)
      .then(res => res.json())
      .then(data => {
        let terms = data[1];
        let searched = {[searchTerm]: 1};
        let cleanedTerms = this.cleanData(searchTerm, terms);
        let nodes = this.createNodes(searchTerm, this.state.currentDepth);
        let links = this.createLinks(searchTerm, cleanedTerms);
        cleanedTerms.forEach(term => {
          searched = { ...searched, [term]: 0}
        });

        let currentToBeSearchedTerms = this.state.toBeSearchedTerms;
        for (const [key, value] of Object.entries(searched)) {
          if(!Object.keys(currentToBeSearchedTerms).includes(key)) {
            currentToBeSearchedTerms = {...currentToBeSearchedTerms, [key]: 0};
          }
        }
        currentToBeSearchedTerms[searchTerm] = 1;
        
        this.setState(prevState => ({
          releatedTerms: cleanedTerms,
          toBeSearchedTerms: currentToBeSearchedTerms,
          nodes: [...prevState.nodes, ...nodes],
          links: [...prevState.links, ...links],
          maxDepth: prevState.maxDepth + 1,
          currentDepth: prevState.currentDepth + 1,
        }), this.startQuery);
      });
  }

  startQuery = () => {
    if(this.state.selectedTerm !== "" &&
      (this.state.firstTime || this.isMoreItemsLeftToSearch()) && 
      this.state.maxDepth < 5
    ) {
      let termToSearch = '';
      if(this.state.firstTime) {
        termToSearch = this.state.selectedTerm;
        this.setState({
          firstTime: false
        }, this.setRelatedTerms(termToSearch))
      } else {
        termToSearch = this.termToBeSearched();
        this.setRelatedTerms(termToSearch);
      }
    } else {
      this.generateData();
    }
  }

  onChange = (event) => {
    const self = this;

    if (self.state.typingTimeout) {
       clearTimeout(self.state.typingTimeout);
    }

    self.setState({
       query: event.target.value,
       typing: false,
       typingTimeout: setTimeout(function () {
          if(self.state.query !== "") {
            self.setOptions();
          } else {
            self.setState({
              data: {},
              nodes: [],
              links: [],
            });
          }
         }, 1000)
    });
  }

  autoCompleteChange = (event, value) => {
    const self = this;

    if (self.state.searchTimeout) {
      clearTimeout(self.state.searchTimeout);
    }

    self.setState({
      selectedTerm: value,
      status: '',
      firstTime: true,
      currentDepth: 0,
      maxDepth: 0,
      releatedTerms: [],
      toBeSearchedTerms: {},
      data: {},
      nodes: [],
      links: [],
      searchTimeout: setTimeout(function () {
        self.startQuery();
      }, 1000)
    });
  }

  render() {
    return (
      <div className="App">
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12} className="App-header">
              <Typography variant="h2" gutterBottom> Find Related Ideas </Typography>  
            </Grid>
            <Grid item xs={12} className="App-header">
              <Autocomplete
              freeSolo
              id="free-solo-2-demo"
              disableClearable
              options={this.state.options.map((option) => option)}
              onChange={this.autoCompleteChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Find relations for ..."
                  margin="normal"
                  variant="outlined"
                  style={{ width: 500 }}
                  InputProps={{ ...params.InputProps, type: "search" }}
                  onChange={this.onChange}
                />
              )}
              /> 
            </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Chart data={this.state.data} />
          </Grid>
        </Grid>
        </Container>
        
        {/* <header className="App-header"> */}
        {/* <Typography variant="h2" gutterBottom> Find Related Ideas </Typography>       */}
          {/* <Autocomplete
            freeSolo
            id="free-solo-2-demo"
            disableClearable
            options={this.state.options.map((option) => option)}
            onChange={this.autoCompleteChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Find relations for ..."
                margin="normal"
                variant="outlined"
                style={{ width: 500 }}
                InputProps={{ ...params.InputProps, type: "search" }}
                onChange={this.onChange}
              />
            )}
          /> */}
          {/* <Alert severity="info">{this.state.status}</Alert> */}
        {/* </header> */}
        {/* <Chart data={this.state.data} /> */}
      </div>
    );
  }
}

export default App;
