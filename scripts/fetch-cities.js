import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'

const BASE_URL =
  'https://www.e-stat.go.jp/municipalities/cities/areacode'

const TOTAL_PAGES = 96

async function getPage(page) {
  const url =
    page === 1
      ? BASE_URL
      : `${BASE_URL}?page=${page}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `ページ${page}の取得に失敗しました: ${response.status}`
    )
  }

  return await response.text()
}

function extractCities(html) {
  const $ = cheerio.load(html)

  const cities = []

  // 「都道府県」「市区町村」という
  // ヘッダーを持つテーブルを探す
  $('table').each((_, table) => {
    const headers = $(table)
      .find('tr')
      .first()
      .find('th, td')
      .map((_, cell) => $(cell).text().trim())
      .get()

    const prefectureIndex =
      headers.indexOf('都道府県')

    const groupIndex =
      headers.indexOf(
        '政令市・郡・支庁・振興局等'
      )

    const cityIndex =
      headers.indexOf('市区町村')

    // 目的のテーブルではなければ無視
    if (
      prefectureIndex === -1 ||
      cityIndex === -1
    ) {
      return
    }

    $(table)
      .find('tr')
      .slice(1)
      .each((_, row) => {
        const cells = $(row)
          .find('th, td')
          .map((_, cell) =>
            $(cell).text().trim()
          )
          .get()

        const prefecture =
          cells[prefectureIndex] || ''

        const city =
          cells[cityIndex] || ''

        const group =
          groupIndex !== -1
            ? cells[groupIndex] || ''
            : ''

        if (!prefecture) {
          return
        }

        // 通常の市
        if (city.endsWith('市')) {
          cities.push({
            city,
            prefecture
          })

          return
        }

        // 政令指定都市
        // 例:
        // 大阪府 | 大阪市 | おおさかし | | |
        if (
          !city &&
          group.endsWith('市')
        ) {
          cities.push({
            city: group,
            prefecture
          })
        }
      })
  })

  return cities
}

async function main() {
  console.log('全国の市データを取得しています...')
  console.log(
    `全${TOTAL_PAGES}ページを確認します。`
  )
  console.log('')

  const allCities = []

  for (
    let page = 1;
    page <= TOTAL_PAGES;
    page++
  ) {
    try {
      const html = await getPage(page)

      const cities = extractCities(html)

      console.log(
        `ページ ${page}/${TOTAL_PAGES} → ${cities.length}市`
      )

      allCities.push(...cities)

      // サーバーへの負荷を少し抑える
      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      )
    } catch (error) {
      console.error(
        `ページ ${page} でエラー:`,
        error.message
      )
    }
  }

  // 重複削除
  const uniqueCities = Array.from(
    new Map(
      allCities.map((item) => [
        `${item.prefecture}_${item.city}`,
        item
      ])
    ).values()
  )

  // 都道府県名 → 市名順
  uniqueCities.sort((a, b) => {
    const prefectureResult =
      a.prefecture.localeCompare(
        b.prefecture,
        'ja'
      )

    if (prefectureResult !== 0) {
      return prefectureResult
    }

    return a.city.localeCompare(
      b.city,
      'ja'
    )
  })

  // 都道府県一覧
  const prefectures = [
    ...new Set(
      uniqueCities.map(
        (item) => item.prefecture
      )
    )
  ]

  console.log('')
  console.log('==============================')
  console.log(
    `取得した市: ${uniqueCities.length}件`
  )
  console.log(
    `取得した都道府県: ${prefectures.length}都道府県`
  )
  console.log('==============================')
  console.log('')

  // 都道府県ごとの件数
  for (const prefecture of prefectures) {
    const count =
      uniqueCities.filter(
        (item) =>
          item.prefecture === prefecture
      ).length

    console.log(
      `${prefecture}: ${count}市`
    )
  }

  // 47都道府県チェック
  if (prefectures.length !== 47) {
    console.warn('')
    console.warn(
      `⚠ 都道府県が47ではありません。現在${prefectures.length}都道府県です。`
    )
  }

  // 保存先
  const outputDirectory = path.join(
    process.cwd(),
    'src',
    'data'
  )

  fs.mkdirSync(outputDirectory, {
    recursive: true
  })

  const outputFile = path.join(
    outputDirectory,
    'cities.json'
  )

  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      uniqueCities,
      null,
      2
    ),
    'utf-8'
  )

  console.log('')
  console.log(
    'cities.json を作成しました！'
  )
  console.log('')
  console.log(
    `保存先: ${outputFile}`
  )
}

main().catch((error) => {
  console.error('')
  console.error('エラー:')
  console.error(error)
  process.exit(1)
})
