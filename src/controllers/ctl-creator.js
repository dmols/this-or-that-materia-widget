export const ControllerThisOrThatCreator = ($scope, $timeout, $sanitize, CreatorService, $sce) => {
	$scope.title = 'My This or That widget'
	$scope.randomizeOrder = false
	$scope.questions = []
	$scope.currIndex = -1
	$scope.dialog = {}
	$scope.tutorial = {
		checked: false,
		step: 1,
		text: [
			'Enter a question',
			'Pick the answer type',
		]
	}
	$scope.actions = {
		slidein: false,
		slideleft: false,
		slideright: false,
		add: false,
		remove: false,
		removelast: false
	}
	// const _imgRef = []

	const _assetRef = {
		index: null,
		which: null,
		type: null
	}

	$scope.CORRECT = 'CORRECT'
	$scope.INCORRECT = 'INCORRECT'

	const materiaCallbacks = {}

	materiaCallbacks.initNewWidget = (widget, baseUrl) =>
		$scope.$apply(function() {
			$scope.dialog.intro = true
			$scope.addQuestion()
		})

	materiaCallbacks.initExistingWidget = function(title, widget, qset, version, baseUrl) {
		$scope.title = title
		$scope.tutorial.step = null
		console.log(qset)
		materiaCallbacks.onQuestionImportComplete(qset.items)
	}

	materiaCallbacks.onSaveClicked = function(mode) {
		if (mode == null) {
			mode = 'save'
		}
		const _isValid = $scope.validation('save')

		if (_isValid) {
			// Create a qset to save
			const qset = CreatorService.buildQset(
				$sanitize($scope.title),
				$scope.questions,
				$scope.randomizeOrder
			)
			if (qset) {
				return Materia.CreatorCore.save($sanitize($scope.title), qset, 2)
			}
		} else {
			Materia.CreatorCore.cancelSave('Please make sure every question is complete')

			return false
		}
	}

	materiaCallbacks.onSaveComplete = () => true

	materiaCallbacks.onQuestionImportComplete = function(items) {
		for (let item of items) {
			const _ids = []
			const _urls = []

			if (!item.questions || !item.answers) {
				return
			}

			console.log(item)

			// gets the image URLs
			// try {
			// 	if (
			// 		item.answers &&
			// 		item.answers[0] &&
			// 		item.answers[0].options &&
			// 		item.answers[0].options.asset
			// 	) {
			// 		_ids[0] = item.answers[0].options.asset.id
			// 		_urls[0] = Materia.CreatorCore.getMediaUrl(item.answers[0].options.asset.id)
			// 	}
			// 	if (
			// 		item.answers &&
			// 		item.answers[1] &&
			// 		item.answers[1].options &&
			// 		item.answers[1].options.asset
			// 	) {
			// 		_ids[1] = item.answers[1].options.asset.id
			// 		_urls[1] = Materia.CreatorCore.getMediaUrl(item.answers[1].options.asset.id)
			// 	}
			// } catch (error) {
			// 	alert('Uh oh. Something went wrong with uploading your questions.')
			// 	return
			// }

			try {
				if ( !item.answers[0]?.options.asset.type || item.answers[0].options.asset.type == 'image' || item.answers[0]?.options.asset && item.answers[0].options.asset.type == 'audio') {
					console.log("LEFT has an IMAGE or AUDIO")
					_ids[0] = item.answers[0].options.asset.id
					_urls[0] = Materia.CreatorCore.getMediaUrl(item.answers[0].options.asset.id)
				}
				else
				{
					_ids[0] = null
					_urls[0] = item.answers[0]?.options.asset?.value
				}

				if ( !item.answers[1]?.options.asset.type || item.answers[1].options.asset.type == 'image' || item.answers[1]?.options.asset && item.answers[1].options.asset.type == 'audio' ) {
					console.log("RIGHT has an IMAGE or AUDIO")
					_ids[1] = item.answers[1].options.asset.id
					_urls[1] = Materia.CreatorCore.getMediaUrl(item.answers[1].options.asset.id)
				}
				else
				{
					_ids[1] = null
					_urls[1] = item.answers[1]?.options.asset?.value
				}

			} catch (error) {
				console.log("ERROR CAUGHT")
				console.log(error)
			}

			console.log(_ids)
			console.log(_urls)

			$scope.questions.push({
				title: item.questions[0].text.replace(/\&\#10\;/g, '\n'),
				correct: {
					type: item.answers[0]?.options.asset?.type,
					id: _ids[0],
					alt: item.answers[0]?.text,
					value: _urls[0]
				},
				incorrect: {
					type: item.answers[1]?.options.asset?.type,
					id: _ids[1],
					alt: item.answers[1]?.text,
					value: _urls[1]
				},
				isValid: true,
				qid: item.questions[0].id,
				ansid: item.answers[0].id
			})

			// // Add each imported question to the DOM
			// $scope.questions.push({
			// 	title: item.questions[0].text.replace(/\&\#10\;/g, '\n'),
			// 	options: _ids,
			// 	isValid: true,
			// 	alt: [
			// 		item.answers[0].text,
			// 		item.answers[1].text,
			// 		(item.options != null ? item.options.feedback : undefined) || ''
			// 	],
			// 	URLs: _urls,
			// 	id: item.id,
			// 	qid: item.questions[0].id,
			// 	ansid: item.answers[0].id
			// })
		}

		$scope.currIndex = 0
		$scope.$apply()
	}

	materiaCallbacks.onMediaImportComplete = function(media) {
		$scope.setURL(Materia.CreatorCore.getMediaUrl(media[0].id), media[0].id)
		$scope.$apply()
	}

	const _noTransition = () =>
		(() => {
			const result = []
			for (let action in $scope.actions) {
				if (action !== 'activate') {
					result.push(($scope.actions[action] = false))
				} else {
					result.push(undefined)
				}
			}
			return result
		})()

	const _updateIndex = function(action, data) {
		switch (action) {
			case 'prev':
				if ($scope.currIndex > 0) {
					return $scope.currIndex--
				} else {
					return ($scope.currIndex = $scope.questions.length - 1)
				}
			case 'next':
				if ($scope.currIndex < $scope.questions.length - 1) {
					return $scope.currIndex++
				} else {
					return ($scope.currIndex = 0)
				}
			case 'select':
				return ($scope.currIndex = data)
			case 'add':
				$scope.questions.push(data)
				return ($scope.currIndex = $scope.questions.length - 1)
			case 'remove':
				return $scope.currIndex--
		}
	}

	// View actions
	$scope.duplicate = function(index) {
		if ($scope.questions.length < 50) {
			$scope.actions.add = true
			$timeout(_noTransition, 660, true)

			$timeout(() => _updateIndex('add', angular.copy($scope.questions[index])), 200, true)
		}
	}

	$scope.setTitle = function() {
		if ($scope.title) {
			$scope.dialog.intro = $scope.dialog.edit = false
			$scope.step = 1
		}
	}

	$scope.addQuestion = () => {

		let question = {
			title: '',
			correct: {
				type: null,
				value: null,
				alt: '',
				id: null
			},
			incorrect: {
				type: null,
				value: null,
				alt: '',
				id: null
			},
			isValid: true,
			qid: '',
			ansid: ''
		}
		// if (title == null) {
		// 	title = ''
		// }
		// if (answerType == null) {
		// 	answerType = ['', '']
		// }
		// if (options == null) {
		// 	options = ['', '']
		// }
		// if (imgsFilled == null) {
		// 	imgsFilled = [false, false]
		// }
		// if (isValid == null) {
		// 	isValid = true
		// }
		// if (alt == null) {
		// 	alt = ['', '']
		// }
		// if (URLs == null) {
		// 	URLs = ['', '']
		// }
		// if (id == null) {
		// 	id = ''
		// }
		// if (qid == null) {
		// 	qid = ''
		// }
		// if (ansid == null) {
		// 	ansid = ''
		// }
		if ($scope.questions.length > 0) {
			if ($scope.questions.length < 50) {
				$scope.actions.add = true
				$timeout(_noTransition, 660, true)

				$timeout(
					() => _updateIndex('add', question),
					200,
					true
				)
			}
		} else {
			$scope.questions.push(question)

			$scope.currIndex = $scope.questions.length - 1
		}
	}

	$scope.removeQuestion = function(index) {
		if ($scope.currIndex + 1 === $scope.questions.length) {
			$scope.actions.removelast = true
		} else {
			$scope.actions.remove = true
		}

		$timeout(_noTransition, 660, true)
		$scope.questions.splice(index, 1)

		if ($scope.currIndex === $scope.questions.length) {
			$timeout(() => _updateIndex('remove'), 200, true)
		}
	}

	$scope.updateAnswerType = function(type, currIndex, side) {
		// $scope.questions[currIndex].answerType[side] = type
		let sideIndex = 0
		if (side == $scope.CORRECT) {
			$scope.questions[currIndex].correct.type = type
		}
		else
		{
			$scope.questions[currIndex].incorrect.type = type
			sideIndex = 1
		}

		$scope.tutorialIncrement(sideIndex ? 5 : 2)
		switch (type) {
			case 'image':
				if (side == $scope.CORRECT) {
					$scope.questions[currIndex].correct.value = 'assets/img/placeholder.png'
				}
				else
				{
					$scope.questions[currIndex].incorrect.value = 'assets/img/placeholder.png'
				}
				$scope.tutorial.text[sideIndex ? 5 : 2] = `Upload the ${sideIndex ? 'in' : ''}correct image`
				$scope.tutorial.text[sideIndex ? 6 : 3] = `Describe the ${sideIndex ? 'in' : ''}correct image`
				break
			case 'text':
				if (side == $scope.CORRECT) {
					$scope.questions[currIndex].correct.alt = '-'
				}
				else
				{
					$scope.questions[currIndex].incorrect.alt = '-'
				}
				$scope.tutorial.text[sideIndex ? 5 : 2] = `Enter the ${sideIndex ? 'in' : ''}correct answer`
				$scope.tutorial.text[sideIndex ? 6 : 3] = ``
				break
			case 'audio':
				$scope.tutorial.text[sideIndex ? 5 : 2] = `Upload the ${sideIndex ? 'in' : ''}correct audio`
				$scope.tutorial.text[sideIndex ? 6 : 3] = `Describe the ${sideIndex ? 'in' : ''}correct audio`
				break
			case 'video':
				$scope.tutorial.text[sideIndex ? 5 : 2] = `Link the ${sideIndex ? 'in' : ''}correct video`
				$scope.tutorial.text[sideIndex ? 6 : 3] = `Describe the ${sideIndex ? 'in' : ''}correct video`
				break
		}
		$scope.tutorial.text[sideIndex ? 7 : 4] = sideIndex ? 'Add more questions!' : `Pick the answer type`
	}

	// index: index of question
	// which: correct || incorrect
	$scope.requestImage = function(index, which) {
		Materia.CreatorCore.showMediaImporter(['jpg', 'gif', 'png'])
		// Save the image and which choice it's for
		// _imgRef[0] = index
		// _imgRef[1] = which

		_assetRef.index = index
		_assetRef.which = which
		_assetRef.type = 'image'

		$scope.validation('change', index)
	}

	$scope.requestAudio = function(index, which) {
		Materia.CreatorCore.showMediaImporter(['mp3'])
		// Save the image and which choice it's for
		// _imgRef[0] = index
		// _imgRef[1] = which

		_assetRef.index = index
		_assetRef.which = which
		_assetRef.type = 'audio'

		$scope.validation('change', index)
	}

	$scope.embedVideo = function(index, which) {
		try {
			let embedUrl = $scope.questions[index].options[which]
			if (embedUrl) {
				if (embedUrl.includes('youtu')) {
					const stringMatch = embedUrl.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)
					embedUrl = embedUrl.includes('/embed/') ? embedUrl : ('https://www.youtube.com/embed/' + (stringMatch && stringMatch[1]));
				} else if (embedUrl.includes('vimeo')) {
					const stringMatch = embedUrl.match(/(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i)
					embedUrl = embedUrl.includes('player.vimeo.com') ? embedUrl : 'https://player.vimeo.com/video/' + (stringMatch && stringMatch[1]);
				} else if (['mp4', 'flv', 'm4a', '3gp', 'mkv'].includes(embedUrl.split('.').pop())){
					embedUrl = embedUrl
				} else {
					embedUrl = ''
				}
			}
			$scope.questions[index].options[which] = embedUrl
			return $sce.trustAsResourceUrl(embedUrl)
		} catch (e) {
			// console.log(e)
		}
	}

	$scope.setURL = function(URL, id) {
		// Bind the image URL to the DOM
		// $scope.questions[_imgRef[0]].URLs[_imgRef[1]] = URL
		// $scope.questions[_imgRef[0]].options[_imgRef[1]] = id

		console.log(_assetRef)
		

		if (_assetRef.which == $scope.CORRECT) {
			$scope.questions[_assetRef.index].correct.value = URL
			$scope.questions[_assetRef.index].correct.type = _assetRef.type
			$scope.questions[_assetRef.index].correct.id = id
		}
		else
		{
			$scope.questions[_assetRef.index].incorrect.value = URL
			$scope.questions[_assetRef.index].incorrect.type = _assetRef.type
			$scope.questions[_assetRef.index].incorrect.id = id
		}
	}

	$scope.clearImage = function(index, which) {
		if (which == $scope.CORRECT) {
			$scope.questions[index].correct.value = 'http://placehold.it/300x250'
			$scope.questions[index].correct.id = null
		}
		else
		{
			$scope.questions[index].incorrect.value = 'http://placehold.it/300x250'
			$scope.questions[index].incorrect.id = null
		}
		// $scope.$apply()
	}

	$scope.clearType = function(index, which) {
		if (which == $scope.CORRECT) {
			$scope.questions[index].correct.value = null
			$scope.questions[index].correct.id = null
			$scope.questions[index].correct.alt = ''
			$scope.questions[index].correct.type = null
		}
		else
		{
			$scope.questions[index].incorrect.value = null
			$scope.questions[index].incorrect.id = null
			$scope.questions[index].incorrect.alt = ''
			$scope.questions[index].incorrect.type = null
		}
	}

	$scope.next = function() {
		$scope.actions.slideright = true

		$timeout(() => _updateIndex('next'), 200, true)

		$timeout(_noTransition, 660, true)
	}

	$scope.prev = function() {
		$scope.actions.slideleft = true

		$timeout(() => _updateIndex('prev'), 200, true)

		$timeout(_noTransition, 660, true)
	}

	$scope.selectCurrent = function(index) {
		if (index > $scope.currIndex) {
			$scope.actions.slideright = true
		}
		if (index < $scope.currIndex) {
			$scope.actions.slideleft = true
		}

		$timeout(() => _updateIndex('select', index), 200, true)

		$timeout(_noTransition, 660, true)
	}

	$scope.tutorialIncrement = function(step) {
		if ($scope.tutorial.step > 0) {
			switch (step) {
				case 1:
					if ($scope.tutorial.step === 1) {
						return $scope.tutorial.step++
					}
					break
				case 2:
					if ($scope.tutorial.step === 2) {
						return $scope.tutorial.step++
					}
					break
				case 3:
					if ($scope.tutorial.step === 3) {
						return $scope.tutorial.step++
					}
					break
				case 4:
					if ($scope.tutorial.step === 4) {
						return $scope.tutorial.step++
					}
					break
				case 5:
					if ($scope.tutorial.step === 5) {
						return $scope.tutorial.step++
					}
					break
				case 6:
					if ($scope.tutorial.step === 6) {
						return $scope.tutorial.step++
					}
					break
				case 7:
					if ($scope.tutorial.step === 7) {
						return $scope.tutorial.step++
					}
					break
				case 8:
					if ($scope.tutorial.step === 8) {
						return ($scope.tutorial.step = null)
					}
			}
		} else {
			return false
		}
	}

	$scope.limitLength = () =>
		($scope.questions[$scope.currIndex].title = $scope.questions[$scope.currIndex].title.substring(
			0,
			500
		))

	$scope.validation = function(action, which) {
		switch (action) {
			case 'save':
				for (let q of $scope.questions) {
					if (!q.title || !q.correct.alt || !q.incorrect.alt || !q.correct.value || !q.incorrect.value) {
						q.invalid = true
						$scope.dialog.invalid = true
						$scope.$apply()
					}
				}
				if ($scope.dialog.invalid) {
					return false
				} else {
					return true
				}
			case 'change':
				if (
					$scope.questions[which].title &&
					$scope.questions[which].correct.alt &&
					$scope.questions[which].incorrect.alt &&
					$scope.questions[which].correct.value &&
					$scope.questions[which].incorrect.value
				) {
					return ($scope.questions[which].invalid = false)
				}
				break
		}
	}

	$scope.hideModal = () =>
		($scope.dialog.invalid = $scope.dialog.edit = $scope.dialog.intro = false)

	$scope.debugDump = () =>
		console.log($scope.questions)

	return Materia.CreatorCore.start(materiaCallbacks)
}
