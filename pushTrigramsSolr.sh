i=0
while [ $i -le 6 ]; do
  filebase="@C:/git/5grams_cleaned_"
  fileName="$filebase$i.json"
  echo $fileName
  curl 'http://localhost:8983/solr/trigrams/update/json/docs?split=/data&f=count:/data/count&f=ngrams:/data/ngrams&commit=true&commitWithin=25000'\
  -H 'Content-type:application/json' -d $fileName
  i=$(( $i + 1 ))
done

i=0
while [ $i -le 9 ]; do
  filebase="@C:/git/3grams_cleaned_"
  fileName="$filebase$i.json"
  echo $fileName
  curl 'http://localhost:8983/solr/trigrams/update/json/docs?split=/data&f=count:/data/count&f=ngrams:/data/ngrams&commit=true&commitWithin=25000'\
  -H 'Content-type:application/json' -d $fileName
  i=$(( $i + 1 ))
done